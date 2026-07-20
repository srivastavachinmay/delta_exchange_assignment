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
 */

export function computeImbalance(book: OrderBook, levels = 10): ImbalanceResult | null {
  if (book.bids.length === 0 && book.asks.length === 0) return null;

  let totalBidSize = 0;
  let totalAskSize = 0;

  const bidLevels = Math.min(levels, book.bids.length);
  const askLevels = Math.min(levels, book.asks.length);
  const levelsConsidered = Math.max(bidLevels, askLevels);

  for (let i = 0; i < bidLevels; i++) totalBidSize += book.bids[i]![1];
  for (let i = 0; i < askLevels; i++) totalAskSize += book.asks[i]![1];

  const total = totalBidSize + totalAskSize;
  const value = total === 0 ? 0 : (totalBidSize - totalAskSize) / total;

  return { value, totalBidSize, totalAskSize, levelsConsidered };
}