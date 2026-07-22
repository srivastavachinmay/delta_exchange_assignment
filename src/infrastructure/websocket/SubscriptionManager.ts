import type { Channel, TradingSymbol, OutboundMessage } from '@/shared/types';
import type { WebSocketManager } from './WebSocketManager';
import { logger } from '@/shared/utils/DevelopmentLogger';

const PROTOCOL_CHANNEL: Readonly<Partial<Record<Channel, string>>> = {
  ticker: 'v2/ticker',
  orderbook: 'l2_orderbook',
  trades: 'all_trades',
};

export interface SubscriptionManagerCallbacks {
  onDesiredAdded(symbols: TradingSymbol[], channel: Channel): void;
  onDesiredRemoved(symbols: TradingSymbol[], channel: Channel): void;
}

export class SubscriptionManager {
  private readonly desired = new Map<Channel, Set<TradingSymbol>>();
  private callbacks: SubscriptionManagerCallbacks | null = null;

  constructor(private readonly manager: WebSocketManager) {}

  setCallbacks(callbacks: SubscriptionManagerCallbacks): void {
    this.callbacks = callbacks;
  }

  subscribe(channel: Channel, symbols: TradingSymbol | TradingSymbol[]): void {
    const arr = Array.isArray(symbols) ? symbols : [symbols];

    const bucket = this._getOrCreateBucket(channel);
    const fresh: TradingSymbol[] = [];

    for (const symbol of arr) {
      if (!bucket.has(symbol)) {
        bucket.add(symbol);
        fresh.push(symbol);
      }
    }

    if (fresh.length === 0) return;

    logger.subscribeIntent(channel, fresh);
    if (this.manager.isConnected) {
      this.manager.send(this._buildSubscribePayload(channel, fresh));
    }
    this.callbacks?.onDesiredAdded(fresh, channel);
  }

  unsubscribe(channel: Channel, symbols: TradingSymbol | TradingSymbol[]): void {
    const arr = Array.isArray(symbols) ? symbols : [symbols];
    const bucket = this.desired.get(channel);
    if (!bucket) return;

    const removed: TradingSymbol[] = [];
    for (const symbol of arr) {
      if (bucket.has(symbol)) {
        bucket.delete(symbol);
        removed.push(symbol);
      }
    }

    if (bucket.size === 0) {
      this.desired.delete(channel);
    }

    if (removed.length === 0) return;

    logger.unsubscribeIntent(channel, removed);
    if (this.manager.isConnected) {
      this.manager.send(this._buildUnsubscribePayload(channel, removed));
    }
    this.callbacks?.onDesiredRemoved(removed, channel);
  }

  replayAll(): void {
    if (this.desired.size === 0) return;

    const channels = this._buildChannelList();
    if (channels.length === 0) return;

    logger.subscriptionReplay(channels.length);
    this.manager.send({
      type: 'subscribe',
      payload: { channels },
    });
  }

  handleAcknowledgement(
    _channels: readonly Channel[],
    _symbols: readonly TradingSymbol[],
  ): void {}

  private _getOrCreateBucket(channel: Channel): Set<TradingSymbol> {
    let bucket = this.desired.get(channel);
    if (!bucket) {
      bucket = new Set<TradingSymbol>();
      this.desired.set(channel, bucket);
    }
    return bucket;
  }

  private _buildSubscribePayload(channel: Channel, symbols: TradingSymbol[]): OutboundMessage {
    return {
      type: 'subscribe',
      payload: { channels: [{ name: this._protocolName(channel), symbols }] },
    };
  }

  private _buildUnsubscribePayload(channel: Channel, symbols: TradingSymbol[]): OutboundMessage {
    return {
      type: 'unsubscribe',
      payload: { channels: [{ name: this._protocolName(channel), symbols }] },
    };
  }

  private _buildChannelList(): Array<{ name: string; symbols: TradingSymbol[] }> {
    const result: Array<{ name: string; symbols: TradingSymbol[] }> = [];
    for (const [channel, symbolSet] of this.desired) {
      if (symbolSet.size === 0) continue;
      result.push({ name: this._protocolName(channel), symbols: Array.from(symbolSet) });
    }
    return result;
  }

  private _protocolName(channel: Channel): string {
    return PROTOCOL_CHANNEL[channel] ?? channel;
  }
}

import { wsManager } from './WebSocketManager';
export const subscriptionManager = new SubscriptionManager(wsManager);
