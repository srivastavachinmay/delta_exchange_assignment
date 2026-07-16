/**
 * TradeEngine — Domain Service
 *
 * Responsibility:
 * - Append incoming trades to an ordered collection
 * - Maintain a bounded ring buffer (prevents unbounded memory growth)
 * - Deduplicate by trade ID (exchange may re-send on reconnect)
 *
 * Design:
 * - Stateless: caller owns and passes the trade collection
 * - Max capacity is configurable (default 200 — enough for scrollable UI)
 * - Pure: append(trades, newTrade) → updatedTrades
 *
 * Phase 4: implement append() and parseMessage() with actual Delta payload.
 */

import type { RawTradesMessage } from '@/shared/types';
import type { Trade } from '../entities/Trade';

export const DEFAULT_TRADE_CAPACITY = 200;

export class TradeEngine {
  /**
   * Parse a raw trades message into an array of Trade entities.
   * A single WS message may contain multiple trade executions.
   *
   * TODO Phase 4:
   * - Map Delta payload fields to Trade entity
   * - Validate price, size, side fields
   * - Assign monotonic IDs if server doesn't provide them
   */
  parseMessage(_message: RawTradesMessage): Trade[] {
    throw new Error('TradeEngine.parseMessage() not implemented — Phase 4');
  }

  /**
   * Append new trades to the existing collection, respecting capacity.
   * Newest trades appear first (prepend). Oldest are dropped when full.
   *
   * TODO Phase 4:
   * - Deduplicate by trade ID
   * - Slice to capacity
   * - Return new array reference (immutable update pattern)
   */
  append(_current: readonly Trade[], _incoming: readonly Trade[]): readonly Trade[] {
    throw new Error('TradeEngine.append() not implemented — Phase 4');
  }
}
