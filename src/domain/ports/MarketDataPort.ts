/**
 * MarketDataPort — inbound driving port.
 *
 * Hexagonal architecture: the domain defines WHAT data it needs and HOW
 * to control the transport. Infrastructure implements this interface.
 *
 * Benefits:
 * - Domain never imports WebSocket, fetch, or any I/O primitive
 * - Tests inject a MockMarketDataAdapter with fixture data
 * - Swap Delta Exchange for Binance: new adapter, no domain changes
 *
 * Data delivery: messages flow through MessageQueue → MarketDataPipeline,
 * not through handler callbacks. This port covers transport control only.
 */

import type { Channel, TradingSymbol } from '@/shared/types';

export interface MarketDataPort {
  /** Subscribe to a channel for a symbol via the underlying transport. */
  subscribe(symbol: TradingSymbol, channel: Channel): void;
  unsubscribe(symbol: TradingSymbol, channel: Channel): void;

  /** Connect the underlying transport. Idempotent. */
  connect(): void;
  disconnect(): void;
}
