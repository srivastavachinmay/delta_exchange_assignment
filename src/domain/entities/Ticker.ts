/**
 * Ticker entity — a point-in-time snapshot of a symbol's market state.
 *
 * Immutable by convention (readonly). Never mutated — engines produce new
 * instances from each incoming update. This enables referential comparison:
 *   if (prevTicker === nextTicker) return // no re-render
 *
 * Fields typed precisely in Phase 2 when raw message shape is confirmed.
 */

import type { TradingSymbol } from '@/shared/types';
import type { Price } from '../valueObjects/Price';

export interface Ticker {
  readonly symbol: TradingSymbol;
  readonly lastPrice: Price;
  readonly markPrice: Price;
  readonly indexPrice: Price;
  readonly bestBid: Price;
  readonly bestAsk: Price;
  /** Percentage change over the last 24 hours. */
  readonly change24h: number;
  readonly volume24h: number;
  readonly high24h: Price;
  readonly low24h: Price;
  readonly openInterest: number;
  readonly fundingRate: number;
  /** Unix timestamp of this snapshot in milliseconds. */
  readonly timestamp: number;
}
