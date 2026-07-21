import type { TradingSymbol } from '@/shared/types';
import type { Ticker } from '@/domain/entities/Ticker';

export const DEFAULT_PUBLISH_INTERVAL_MS = 500;

/**
 * Decouples domain processing rate from UI render rate.
 *
 * update() is called for each incoming ticker after engine processing. It owns
 * the staleness guard: if the new ticker's timestamp is not newer than the last
 * accepted ticker for that symbol, the update is silently dropped. This keeps
 * the guard responsibility inside the publisher rather than forcing callers to
 * read from external stores to drive the decision.
 *
 * tryFlush() is called every frame but only writes to the store once the display
 * interval has elapsed — keeping renders at a human-readable cadence (~6fps at
 * 150ms) while the pipeline processes data at full speed.
 */
export class TickerPublisher {
  private readonly pending = new Map<TradingSymbol, Ticker>();
  /** Tracks the timestamp of the last accepted (non-stale) ticker per symbol. */
  private readonly lastAccepted = new Map<TradingSymbol, number>();
  private lastPublishAt = 0;

  constructor(private readonly intervalMs: number = DEFAULT_PUBLISH_INTERVAL_MS) {}

  update(ticker: Ticker): void {
    const prevTimestamp = this.lastAccepted.get(ticker.symbol);
    if (prevTimestamp !== undefined && ticker.timestamp <= prevTimestamp) return;
    this.lastAccepted.set(ticker.symbol, ticker.timestamp);
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
