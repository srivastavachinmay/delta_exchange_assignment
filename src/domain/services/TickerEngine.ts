/**
 * TickerEngine — Domain Service
 *
 * Responsibility:
 * - Transform raw ticker messages into Ticker domain entities
 * - Apply validation (price sanity, timestamp ordering)
 * - Compute derived fields (price change direction for flash animations)
 *
 * Design:
 * - Stateless: each call returns a new entity, no internal state
 * - Pure: given same inputs, returns same output
 * - No imports from application, infrastructure, or React
 * - Fully testable with plain Node — see tests/domain/TickerEngine.test.ts
 *
 * Phase 2: implement process() and validate() with actual Delta payload shape.
 */

import type { RawTickerMessage } from '@/shared/types';
import type { Ticker } from '../entities/Ticker';

export class TickerEngine {
  /**
   * Transform a raw ticker message into a typed Ticker entity.
   *
   * TODO Phase 2:
   * - Map Delta-specific field names to our domain model
   * - Apply price validation via createPrice()
   * - Compute change24h direction for comparison with previous
   */
  process(_message: RawTickerMessage): Ticker {
    throw new Error('TickerEngine.process() not implemented — Phase 2');
  }

  /**
   * Validate that a new ticker is a meaningful update over the previous.
   * Returns false if the update should be discarded (stale timestamp, no change).
   *
   * TODO Phase 2: timestamp ordering check, price sanity check
   */
  isValidUpdate(_next: Ticker, _prev: Ticker | undefined): boolean {
    throw new Error('TickerEngine.isValidUpdate() not implemented — Phase 2');
  }
}
