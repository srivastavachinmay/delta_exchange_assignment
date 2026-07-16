import type { Channel, TradingSymbol } from '@/shared/types';
import type {
  MarketDataPort,
  TickerHandler,
  OrderBookHandler,
  TradesHandler,
} from '@/domain/ports/MarketDataPort';
import type { MessageRouterPort } from '@/domain/ports/MessageRouterPort';
import type { WebSocketManager } from './WebSocketManager';
import type { SubscriptionManager } from './SubscriptionManager';

export class WebSocketAdapter implements MarketDataPort {
  private readonly tickerHandlers = new Set<TickerHandler>();
  private readonly orderBookHandlers = new Set<OrderBookHandler>();
  private readonly tradesHandlers = new Set<TradesHandler>();

  constructor(
    private readonly router: MessageRouterPort,
    private readonly manager: WebSocketManager,
    private readonly subscriptionManager: SubscriptionManager,
  ) {}

  /**
   * Wire all listeners and handlers. Call once from the composition root
   * after constructing all collaborators, before connect().
   */
  initialize(): void {
    this.manager.registerListener((raw) => this.router.route(raw));
    this.manager.registerReadyListener(() => this.subscriptionManager.replayAll());

    this.router.registerHandler('ticker', (msg) => {
      if (msg.channel !== 'ticker') return;
      this.tickerHandlers.forEach((h) => h(msg as Parameters<TickerHandler>[0]));
    });

    this.router.registerHandler('orderbook', (msg) => {
      if (msg.channel !== 'orderbook') return;
      this.orderBookHandlers.forEach((h) => h(msg as Parameters<OrderBookHandler>[0]));
    });

    this.router.registerHandler('trades', (msg) => {
      if (msg.channel !== 'trades') return;
      this.tradesHandlers.forEach((h) => h(msg as Parameters<TradesHandler>[0]));
    });
  }

  onTicker(handler: TickerHandler): void {
    this.tickerHandlers.add(handler);
  }

  onOrderBook(handler: OrderBookHandler): void {
    this.orderBookHandlers.add(handler);
  }

  onTrades(handler: TradesHandler): void {
    this.tradesHandlers.add(handler);
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
