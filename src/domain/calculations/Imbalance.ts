/**
 * Imbalance — order book buy/sell pressure metric.
 *
 * Imbalance = (totalBidSize - totalAskSize) / (totalBidSize + totalAskSize)
 * Range: -1 (pure sell pressure) to +1 (pure buy pressure).
 *
 * Typically computed over the top N levels (default: 10) to avoid noise
 * from deep, illiquid levels that don't reflect real market pressure.
 *
 * Phase 3: implement computeImbalance().
 */

import type { OrderBook } from '../entities/OrderBook';

export interface ImbalanceResult {
  /** -1 to +1. Positive = more bid liquidity. */
  readonly value: number;
  readonly totalBidSize: number;
  readonly totalAskSize: number;
  readonly levelsConsidered: number;
}

/**
 * Compute order book imbalance over the top `levels` price levels per side.
 * Returns null if the book is empty.
 *
 * TODO Phase 3: implement
 */
export function computeImbalance(
  _book: OrderBook,
  _levels = 10,
): ImbalanceResult | null {
  throw new Error('computeImbalance() not implemented — Phase 3');
}
