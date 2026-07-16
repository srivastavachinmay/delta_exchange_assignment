/**
 * Grouping — price level aggregation for the order book display.
 *
 * When a user selects a grouping of $1, all bids/asks within $1 bands
 * are combined into a single displayed row. This reduces visual noise
 * at high precision while preserving market structure.
 *
 * Example: bids at 42,000.1, 42,000.5, 42,000.9 with grouping 1
 * → displayed as a single row at 42,000 with combined size.
 *
 * Phase 3: implement group() and validate allowedGroupings.
 */

import type { PriceLevel } from '../entities/OrderBook';

export interface GroupingOptions {
  readonly step: number;
  /** Maximum levels to return after grouping. */
  readonly maxDepth: number;
}

/**
 * Aggregate price levels into grouped bands.
 * Bids group down (floor to step), asks group up (ceil to step).
 *
 * TODO Phase 3: implement
 */
export function groupLevels(
  _levels: readonly PriceLevel[],
  _options: GroupingOptions,
  _side: 'bid' | 'ask',
): readonly PriceLevel[] {
  throw new Error('groupLevels() not implemented — Phase 3');
}

/**
 * Round a price down to the nearest grouping step (for bids).
 * Example: groupDown(42_150.7, 50) → 42_150
 */
export function groupDown(price: number, step: number): number {
  return Math.floor(price / step) * step;
}

/**
 * Round a price up to the nearest grouping step (for asks).
 * Example: groupUp(42_150.3, 50) → 42_200
 */
export function groupUp(price: number, step: number): number {
  return Math.ceil(price / step) * step;
}
