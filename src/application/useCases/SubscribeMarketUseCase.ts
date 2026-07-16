/**
 * SubscribeMarketUseCase — subscribe/unsubscribe to market data channels.
 *
 * Responsibility:
 * - Validate the symbol and channel before delegating to the port
 * - Orchestrate multi-channel subscriptions (e.g., subscribe to ticker + orderbook)
 * - Guard against duplicate subscriptions
 *
 * This is an application use case: it knows about the MarketDataPort (infrastructure
 * boundary) but not about the concrete WebSocket adapter behind it.
 *
 * Phase 2: implement subscribeAll() and unsubscribeAll() per symbol.
 */

import type { Channel, TradingSymbol } from '@/shared/types';
import type { MarketDataPort } from '@/domain/ports/MarketDataPort';
import { isMarketSymbol } from '@/domain/valueObjects/MarketSymbol';

export class SubscribeMarketUseCase {
  constructor(private readonly marketData: MarketDataPort) {}

  /**
   * Subscribe to a single channel for a symbol.
   * Validates symbol before passing to the infrastructure adapter.
   */
  subscribe(symbol: TradingSymbol, channel: Channel): void {
    if (!isMarketSymbol(symbol)) {
      console.warn(`[SubscribeMarketUseCase] unsupported symbol: ${symbol}`);
      return;
    }
    this.marketData.subscribe(symbol, channel);
  }

  unsubscribe(symbol: TradingSymbol, channel: Channel): void {
    this.marketData.unsubscribe(symbol, channel);
  }

  /**
   * Subscribe to all channels needed for the full trading view.
   *
   * TODO Phase 2: define the canonical channel set per symbol.
   * For now, the channels list is explicit — no magic "subscribe to everything".
   */
  subscribeAll(symbol: TradingSymbol, channels: readonly Channel[]): void {
    for (const channel of channels) {
      this.subscribe(symbol, channel);
    }
  }

  unsubscribeAll(symbol: TradingSymbol, channels: readonly Channel[]): void {
    for (const channel of channels) {
      this.unsubscribe(symbol, channel);
    }
  }
}
