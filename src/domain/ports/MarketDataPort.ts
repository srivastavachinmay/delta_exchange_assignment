/**
 * MarketDataPort — inbound driving port.
 *
 * Hexagonal architecture: the domain defines WHAT data it needs and HOW
 * to receive it. Infrastructure implements this interface.
 *
 * Benefits:
 * - Domain never imports WebSocket, fetch, or any I/O primitive
 * - Tests inject MockMarketDataAdapter with fixture data
 * - Swap Delta Exchange for Binance: new adapter, no domain changes
 *
 * The adapter's job: translate raw WS message format → typed structs here.
 * The engine's job: validate and transform those structs → domain entities.
 */

import type { Channel, TradingSymbol } from '@/shared/types';
import type { RawTickerMessage, RawOrderBookMessage, RawTradesMessage } from '@/shared/types';

export type TickerHandler = (message: RawTickerMessage) => void;
export type OrderBookHandler = (message: RawOrderBookMessage) => void;
export type TradesHandler = (message: RawTradesMessage) => void;

export interface MarketDataPort {
  /**
   * Register a handler invoked on each incoming ticker message.
   * Multiple handlers can be registered (fan-out).
   */
  onTicker(handler: TickerHandler): void;
  onOrderBook(handler: OrderBookHandler): void;
  onTrades(handler: TradesHandler): void;

  /** Subscribe to a channel for a symbol via the underlying transport. */
  subscribe(symbol: TradingSymbol, channel: Channel): void;
  unsubscribe(symbol: TradingSymbol, channel: Channel): void;

  /** Connect the underlying transport. Idempotent. */
  connect(): void;
  disconnect(): void;
}
