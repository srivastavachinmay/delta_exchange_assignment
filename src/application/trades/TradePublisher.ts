import type { TradingSymbol } from '@/shared/types';

export const DEFAULT_TRADE_PUBLISH_INTERVAL_MS = 100;

export class TradePublisher {
  private readonly dirty = new Set<TradingSymbol>();
  private lastPublishAt = 0;

  constructor(private readonly intervalMs: number = DEFAULT_TRADE_PUBLISH_INTERVAL_MS) {}

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
