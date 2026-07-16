/**
 * Depth — cumulative size calculation for the order book.
 *
 * Each displayed row shows its own size AND the running total from the top.
 * This is the "depth" bar that visually indicates relative liquidity.
 *
 * Phase 3: implement computeCumulativeDepth().
 */

import type { PriceLevel } from '../entities/OrderBook';

export interface DepthLevel {
  readonly price: number;
  readonly size: number;
  readonly cumulativeSize: number;
  /** 0–1, relative to the maximum cumulative size in this side. */
  readonly depthPercent: number;
}

/**
 * Compute cumulative depth for a sorted array of price levels.
 * Returns the same levels enriched with cumulative size and depth percent.
 *
 * TODO Phase 3: implement
 */
export function computeCumulativeDepth(
  _levels: readonly PriceLevel[],
): readonly DepthLevel[] {
  throw new Error('computeCumulativeDepth() not implemented — Phase 3');
}
