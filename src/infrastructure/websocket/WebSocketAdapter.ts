import type { Channel, TradingSymbol } from '@/shared/types';
import type { MarketDataPort } from '@/domain/ports/MarketDataPort';
import type { MessageRouterPort } from '@/domain/ports/MessageRouterPort';
import type { WebSocketManager } from './WebSocketManager';
import type { SubscriptionManager } from './SubscriptionManager';

/**
 * WebSocketAdapter — bridges the WebSocket transport into the application pipeline.
 *
 * Responsibilities:
 * - Register router.route as the raw-message listener on WebSocketManager
 * - Register subscriptionManager.replayAll on reconnect (ready listener)
 * - Delegate subscribe/unsubscribe/connect/disconnect to the underlying managers
 *
 * Data delivery: raw frames flow into MessageRouter → MessageQueue →
 * MarketDataPipeline. This adapter does not participate in per-message
 * routing beyond handing frames to the router.
 */
export class WebSocketAdapter implements MarketDataPort {
  private readonly boundRoute: (raw: string) => void;
  private readonly boundReplayAll: () => void;

  constructor(
    private readonly router: MessageRouterPort,
    private readonly manager: WebSocketManager,
    private readonly subscriptionManager: SubscriptionManager,
  ) {
    this.boundRoute = (raw: string) => this.router.route(raw);
    this.boundReplayAll = () => this.subscriptionManager.replayAll();
  }

  initialize(): void {
    this.manager.registerListener(this.boundRoute);
    this.manager.registerReadyListener(this.boundReplayAll);
  }

  cleanup(): void {
    this.manager.removeListener(this.boundRoute);
    this.manager.removeReadyListener(this.boundReplayAll);
  }

  subscribe(symbol: TradingSymbol, channel: Channel): void {
    this.subscriptionManager.subscribe(channel, symbol);
  }

  unsubscribe(symbol: TradingSymbol, channel: Channel): void {
    this.subscriptionManager.unsubscribe(channel, symbol);
  }

  connect(): void {
    this.manager.connect();
  }

  disconnect(): void {
    this.manager.disconnect();
  }
}
