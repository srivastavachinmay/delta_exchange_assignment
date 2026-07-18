import type { TradingSymbol } from '@/shared/types';

export const DEFAULT_ORDERBOOK_PUBLISH_INTERVAL_MS = 100;

/**
 * Tracks which symbols have received updates since the last flush.
 * The engine's Maps are always up-to-date; this gate controls how often
 * the expensive snapshot() → store write path runs.
 */
export class OrderBookPublisher {
  private readonly dirty = new Set<TradingSymbol>();
  private lastPublishAt = 0;

  constructor(private readonly intervalMs: number = DEFAULT_ORDERBOOK_PUBLISH_INTERVAL_MS) {}

  markDirty(symbol: TradingSymbol): void {
    this.dirty.add(symbol);
  }

  tryFlush(
    timestamp: DOMHighResTimeStamp,
    onPublish: (symbols: readonly TradingSymbol[]) => void,
  ): void {
    if (this.dirty.size === 0) return;
    if (timestamp - this.lastPublishAt < this.intervalMs) return;

    const symbols = [...this.dirty];
    this.dirty.clear();
    this.lastPublishAt = timestamp;
    onPublish(symbols);
  }
}
