import type { Channel, TradingSymbol } from '@/shared/types';
import type { RawTickerMessage, RawOrderBookMessage, RawTradesMessage } from '@/shared/types';
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
      this.tickerHandlers.forEach((h) => h(msg as RawTickerMessage));
    });

    this.router.registerHandler('orderbook', (msg) => {
      this.orderBookHandlers.forEach((h) => h(msg as RawOrderBookMessage));
    });

    this.router.registerHandler('trades', (msg) => {
      this.tradesHandlers.forEach((h) => h(msg as RawTradesMessage));
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
