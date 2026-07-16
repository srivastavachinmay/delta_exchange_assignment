/**
 * BatchProcessor — coalesces multiple messages into a single domain update.
 *
 * Pipeline position: MessageQueue → [BatchProcessor] → RAF → Domain Engine
 *
 * Problem it solves:
 * Even after buffering, a single animation frame may contain 5-10 orderbook
 * deltas for the same symbol. Processing each delta independently is wasteful:
 * 5 engine calls, 5 Zustand writes, 5 React re-renders.
 *
 * Solution:
 * Within a single frame's drain, group messages by (symbol, channel).
 * Apply only the LAST message per group (for ticker, where latest wins),
 * or apply all deltas in sequence (for orderbook, where order matters).
 *
 * Phase 5:
 * - implement process(messages) → batches grouped by symbol+channel
 * - ticker batching strategy: last-wins
 * - orderbook batching strategy: ordered-sequence
 * - trades batching strategy: accumulate-all
 */

import type { InboundMessage, Channel, TradingSymbol } from '@/shared/types';

export type BatchingStrategy = 'last-wins' | 'ordered-sequence' | 'accumulate-all';

export interface BatchGroup {
  readonly symbol: TradingSymbol;
  readonly channel: Channel;
  readonly messages: readonly InboundMessage[];
  readonly strategy: BatchingStrategy;
}

export interface IBatchProcessor {
  /**
   * Group a set of drained messages into batches ready for domain processing.
   * Returns one BatchGroup per (symbol, channel) pair.
   */
  process(messages: readonly InboundMessage[]): readonly BatchGroup[];
}

/**
 * BatchProcessor stub.
 * Phase 5: implement per-channel batching strategies.
 */
export class BatchProcessor implements IBatchProcessor {
  // TODO Phase 5: configurable strategies per channel
  // private readonly strategies: Map<Channel, BatchingStrategy>

  process(_messages: readonly InboundMessage[]): readonly BatchGroup[] {
    throw new Error('BatchProcessor not implemented — Phase 5');
  }
}
