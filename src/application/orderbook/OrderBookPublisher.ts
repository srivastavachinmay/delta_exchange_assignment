import type { TradingSymbol } from '@/shared/types';
import type { OrderBook } from '@/domain/entities/OrderBook';
import type { OrderBookViewModel } from '@/domain/entities/OrderBookViewModel';
import { buildViewModel } from '@/domain/entities/OrderBookViewModel';

export const DEFAULT_ORDERBOOK_PUBLISH_INTERVAL_MS = 500;

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

  transform(book: OrderBook, step: number): OrderBookViewModel {
    return buildViewModel(book, step);
  }
}
