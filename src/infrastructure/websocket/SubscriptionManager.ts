import type { Channel, TradingSymbol } from '@/shared/types';
import { makeSubscriptionKey, type SubscriptionKey } from '@/shared/types';
import type { WebSocketManager } from './WebSocketManager';

type SubscriptionEntry = { readonly symbol: TradingSymbol; readonly channel: Channel };

export class SubscriptionManager {
  /**
   * Desired subscriptions — what the application has requested.
   * Keyed by SubscriptionKey (`${symbol}:${channel}`).
   *
   * Acknowledged subscriptions (server confirmation) are tracked separately
   * in subscriptionStore via SubscriptionHandler. Intentionally decoupled:
   * a subscription can be desired before the socket opens and acknowledged
   * only after the exchange confirms.
   */
  private readonly desired = new Map<SubscriptionKey, SubscriptionEntry>();

  constructor(private readonly manager: WebSocketManager) {}

  subscribe(channel: Channel, symbols: TradingSymbol | TradingSymbol[]): void {
    const arr = Array.isArray(symbols) ? symbols : [symbols];
    const fresh: TradingSymbol[] = [];

    for (const symbol of arr) {
      const key = makeSubscriptionKey(symbol, channel);
      if (!this.desired.has(key)) {
        this.desired.set(key, { symbol, channel });
        fresh.push(symbol);
      }
    }

    if (fresh.length === 0) return;

    this.manager.send({
      type: 'subscribe',
      payload: { channels: [{ name: channel, symbols: fresh }] },
    });
  }

  unsubscribe(channel: Channel, symbols: TradingSymbol | TradingSymbol[]): void {
    const arr = Array.isArray(symbols) ? symbols : [symbols];
    const removed: TradingSymbol[] = [];

    for (const symbol of arr) {
      const key = makeSubscriptionKey(symbol, channel);
      if (this.desired.has(key)) {
        this.desired.delete(key);
        removed.push(symbol);
      }
    }

    if (removed.length === 0) return;

    this.manager.send({
      type: 'unsubscribe',
      payload: { channels: [{ name: channel, symbols: removed }] },
    });
  }

  /**
   * Re-send all desired subscriptions after a reconnect.
   * Groups symbols by channel so one message covers all symbols per channel.
   */
  replayAll(): void {
    if (this.desired.size === 0) return;

    const byChannel = new Map<Channel, TradingSymbol[]>();
    this.desired.forEach(({ symbol, channel }) => {
      const existing = byChannel.get(channel);
      if (existing) {
        existing.push(symbol);
      } else {
        byChannel.set(channel, [symbol]);
      }
    });

    this.manager.send({
      type: 'subscribe',
      payload: {
        channels: Array.from(byChannel.entries()).map(([name, symbols]) => ({
          name,
          symbols,
        })),
      },
    });
  }
}
