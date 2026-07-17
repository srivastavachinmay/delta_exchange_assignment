import type { TradingSymbol } from '@/shared/types';
import type { Ticker } from '@/domain/entities/Ticker';

export const DEFAULT_PUBLISH_INTERVAL_MS = 150;

/**
 * Decouples domain processing rate from UI render rate.
 *
 * The RAF callback processes every ticker message and calls update() per symbol.
 * tryFlush() is called every frame but only writes to the store once the display
 * interval has elapsed — keeping renders at a human-readable cadence (~6fps at
 * 150ms) while the pipeline processes data at full speed.
 *
 * tryFlush is called unconditionally each frame (even when no new messages
 * arrived) so accumulated tickers drain if traffic pauses mid-interval.
 */
export class TickerPublisher {
  private readonly pending = new Map<TradingSymbol, Ticker>();
  private lastPublishAt = 0;

  constructor(private readonly intervalMs: number = DEFAULT_PUBLISH_INTERVAL_MS) {}

  update(ticker: Ticker): void {
    this.pending.set(ticker.symbol, ticker);
  }

  tryFlush(
    timestamp: DOMHighResTimeStamp,
    onPublish: (tickers: readonly Ticker[]) => void,
  ): void {
    if (this.pending.size === 0) return;
    if (timestamp - this.lastPublishAt < this.intervalMs) return;

    const tickers = [...this.pending.values()];
    this.pending.clear();
    this.lastPublishAt = timestamp;
    onPublish(tickers);
  }
}
