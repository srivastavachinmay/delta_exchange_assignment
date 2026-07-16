/**
 * OrderBookEngine — Domain Service
 *
 * Responsibility:
 * - Apply order book snapshots (full state) and deltas (incremental updates)
 * - Maintain bid/ask sort invariants after each delta
 * - Validate sequence numbers (drop out-of-order deltas)
 * - Produce an immutable OrderBook entity after each operation
 *
 * Design:
 * - Stateless: the caller owns the current OrderBook, passes it in each call
 * - Pure: applyDelta(book, delta) → newBook, never mutates the input
 * - Performance-critical: Phase 3 will benchmark this at 50 deltas/sec
 * - No React, no Zustand, no WS — pure TypeScript
 *
 * Phase 3: implement applySnapshot() and applyDelta() with sequence validation.
 */

import type { RawOrderBookMessage } from '@/shared/types';
import type { OrderBook } from '../entities/OrderBook';

export class OrderBookEngine {
  /**
   * Replace the entire order book with a server-sent snapshot.
   * Called on initial subscription and after reconnect.
   *
   * TODO Phase 3:
   * - Parse bids/asks arrays from Delta payload format
   * - Sort: bids descending, asks ascending
   * - Validate sequence number is greater than 0
   */
  applySnapshot(_message: RawOrderBookMessage): OrderBook {
    throw new Error('OrderBookEngine.applySnapshot() not implemented — Phase 3');
  }

  /**
   * Apply an incremental delta to an existing order book.
   * A size of 0 in the delta means remove that price level.
   *
   * TODO Phase 3:
   * - Validate delta.sequence === book.sequence + 1, else discard
   * - Merge delta levels into existing bids/asks
   * - Maintain sort order (binary insert/remove)
   * - Cap at MAX_DEPTH levels (configurable, default 100)
   */
  applyDelta(_current: OrderBook, _message: RawOrderBookMessage): OrderBook {
    throw new Error('OrderBookEngine.applyDelta() not implemented — Phase 3');
  }

  /**
   * Check whether the next delta is sequentially valid.
   * Out-of-sequence deltas require a fresh snapshot.
   */
  isValidSequence(current: OrderBook, nextSequence: number): boolean {
    return nextSequence === current.sequence + 1;
  }
}
