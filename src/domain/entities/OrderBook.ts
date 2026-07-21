/**
 * OrderBook entity — live state of the bid/ask price ladder.
 *
 * Stored as sorted arrays not Maps: arrays give O(1) iteration for rendering,
 * which dominates over the O(log n) insertion cost of incoming deltas.
 *
 * bids: sorted descending by price (best bid first)
 * asks: sorted ascending by price (best ask first)
 *
 * [price, size] tuples to avoid per-entry object allocation at high frequency.
 * This matters at 50 delta messages/sec × 20 levels = 1000 allocations/sec.
 *
 * Delta Exchange sends full snapshots on every l2_orderbook message — no sequence
 * number is present in the wire format and no incremental merging is required.
 */

import type { TradingSymbol } from '@/shared/types';

export type PriceLevel = readonly [price: number, size: number];

export interface OrderBook {
  readonly symbol: TradingSymbol;
  readonly bids: readonly PriceLevel[];
  readonly asks: readonly PriceLevel[];
  readonly timestamp: number;
}

export const EMPTY_ORDER_BOOK: Omit<OrderBook, 'symbol'> = {
  bids: [],
  asks: [],
  timestamp: 0,
};
