/**
 * WebSocketAdapter — bridges WebSocketManager to the MarketDataPort interface.
 *
 * Hexagonal architecture role: driving adapter.
 * The WebSocket is the outside world; this adapter translates raw WS messages
 * into the structured format the application expects via MarketDataPort.
 *
 * Adapter responsibilities:
 * - Register as a raw listener on WebSocketManager
 * - Parse raw JSON → typed InboundMessage (via MessageRouter)
 * - Invoke registered domain handlers with the typed message
 * - Implement MarketDataPort so the application layer talks to this, not WS directly
 *
 * Testability:
 * - Inject a MockWebSocketAdapter in tests to feed fixture messages to the router
 * - Domain and application layers never import WebSocket directly
 */

import type { Channel, TradingSymbol } from '@/shared/types';
import type {
  MarketDataPort,
  TickerHandler,
  OrderBookHandler,
  TradesHandler,
} from '@/domain/ports/MarketDataPort';
import type { MessageRouter } from '@/application/MessageRouter';
import { wsManager } from './WebSocketManager';

export class WebSocketAdapter implements MarketDataPort {
  private readonly tickerHandlers = new Set<TickerHandler>();
  private readonly orderBookHandlers = new Set<OrderBookHandler>();
  private readonly tradesHandlers = new Set<TradesHandler>();

  constructor(private readonly router: MessageRouter) {
    // Register ourselves as the raw message listener.
    // All WS messages flow through the router's channel dispatch.
    wsManager.addListener((raw) => this.router.route(raw));

    // Register data handlers so the router can fan-out to domain handlers.
    // Phase 2/3/4: these will call the domain engines before invoking handlers.
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
    wsManager.subscribe(symbol, channel);
  }

  unsubscribe(symbol: TradingSymbol, channel: Channel): void {
    wsManager.unsubscribe(symbol, channel);
  }

  connect(): void {
    wsManager.connect();
  }

  disconnect(): void {
    wsManager.disconnect();
  }
}
