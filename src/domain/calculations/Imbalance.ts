import type { PriceLevel } from '../entities/OrderBook';

/**
 * Bid proportion of total visible liquidity.
 * 0 = all asks, 0.5 = balanced, 1 = all bids.
 * Returns null when the book is empty on both sides.
 */
export function computeImbalance(
  groupedBids: readonly PriceLevel[],
  groupedAsks: readonly PriceLevel[],
): number | null {
  let bidVol = 0;
  let askVol = 0;
  for (const [, size] of groupedBids) bidVol += size;
  for (const [, size] of groupedAsks) askVol += size;
  const total = bidVol + askVol;
  if (total === 0) return null;
  return bidVol / total;
}