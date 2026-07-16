/**
 * Spread — bid-ask spread calculation.
 *
 * Spread is the difference between the best ask and best bid.
 * It's a key liquidity indicator displayed prominently in the order book header.
 *
 * Phase 3: implement computeSpread().
 */

import type { OrderBook } from '../entities/OrderBook';

export interface SpreadResult {
  readonly absolute: number;  // best ask - best bid
  readonly percent: number;   // absolute / mid-price * 100
  readonly midPrice: number;  // (best bid + best ask) / 2
}

/**
 * Compute the spread from the top of the book.
 * Returns null if the book is empty on either side.
 *
 * TODO Phase 3: implement
 */
export function computeSpread(_book: OrderBook): SpreadResult | null {
  throw new Error('computeSpread() not implemented — Phase 3');
}
