/**
 * BatchProcessor — groups messages by (symbol, channel) and tags each group
 * with its batching strategy.
 *
 * Pipeline position: MessageQueue → [BatchProcessor] → RAF → Domain Engine
 *
 * Responsibility:
 * BatchProcessor is a pure grouper. It collects all messages drained from the
 * queue in a single frame and organises them so the consumer (the RAF callback)
 * can apply the correct strategy per channel:
 *
 *   ticker    — last-wins:         engine may process every message; consumer
 *                                  writes only the final result to the store.
 *   orderbook — ordered-sequence:  all deltas must be applied in order.
 *   trades    — accumulate-all:    every trade is a discrete event; none dropped.
 *
 * BatchProcessor does NOT enforce the strategy itself. It passes all messages
 * to the consumer and lets the consumer decide how to apply them. This keeps
 * batching concerns (grouping) separate from domain concerns (how to process).
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
  process(messages: readonly InboundMessage[]): readonly BatchGroup[];
}

const CHANNEL_STRATEGIES: Readonly<Partial<Record<Channel, BatchingStrategy>>> = {
  ticker: 'last-wins',
  orderbook: 'ordered-sequence',
  trades: 'accumulate-all',
};

export class BatchProcessor implements IBatchProcessor {
  /**
   * Group a set of drained messages into batches ready for domain processing.
   * Returns one BatchGroup per (symbol, channel) pair found in the input.
   * Messages without a resolvable channel or symbol are silently skipped.
   */
  process(messages: readonly InboundMessage[]): readonly BatchGroup[] {
    if (messages.length === 0) return EMPTY;

    type GroupAccumulator = { symbol: TradingSymbol; channel: Channel; msgs: InboundMessage[] };
    const groups = new Map<string, GroupAccumulator>();

    for (const msg of messages) {
      const channel = resolveChannel(msg);
      if (!channel) continue;
      const symbol = resolveSymbol(msg);
      if (!symbol) continue;

      const key = `${symbol}:${channel}`;
      let group = groups.get(key);
      if (!group) {
        group = { symbol, channel, msgs: [] };
        groups.set(key, group);
      }
      group.msgs.push(msg);
    }

    const batches: BatchGroup[] = [];
    for (const { symbol, channel, msgs } of groups.values()) {
      const strategy = CHANNEL_STRATEGIES[channel];
      if (!strategy) continue;

      batches.push({ symbol, channel, messages: msgs, strategy });
    }

    return batches;
  }
}

const EMPTY: readonly BatchGroup[] = [];

/**
 * Resolve the internal channel from a message, normalizing wire-format names.
 * v2/ticker uses `type` as discriminator; orderbook and trades may carry
 * wire channel names (l2_orderbook, all_trades) in their `channel` field.
 */
function resolveChannel(msg: InboundMessage): Channel | undefined {
  const raw = (msg.channel as string | undefined) ?? msg.type;
  switch (raw) {
    case 'v2/ticker':
    case 'ticker':      return 'ticker';
    case 'l2_orderbook':
    case 'orderbook':   return 'orderbook';
    case 'all_trades':
    case 'trades':      return 'trades';
    default:            return undefined;
  }
}

function resolveSymbol(msg: InboundMessage): TradingSymbol | undefined {
  return 'symbol' in msg ? (msg as { symbol?: TradingSymbol }).symbol : undefined;
}
