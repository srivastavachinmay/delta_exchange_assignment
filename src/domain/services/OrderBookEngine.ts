import type { RawOrderBookMessage, TradingSymbol } from '@/shared/types';
import type { OrderBook, PriceLevel } from '../entities/OrderBook';

// Delta Exchange sends full snapshots on every l2_orderbook message — no incremental merging.
// apply() sorts once; snapshot() is an O(n) slice.
interface SymbolBook {
  bids: PriceLevel[]; // sorted descending by price
  asks: PriceLevel[]; // sorted ascending by price
  timestamp: number;
}

export class OrderBookEngine {
  private readonly state = new Map<TradingSymbol, SymbolBook>();

  apply(message: RawOrderBookMessage): void {
    const { symbol, timestamp } = message;

    let book = this.state.get(symbol);
    if (!book) {
      book = { bids: [], asks: [], timestamp };
      this.state.set(symbol, book);
    }

    const bids: PriceLevel[] = [];
    for (const [priceStr, sizeStr] of message.bids) {
      const price = parseFloat(priceStr);
      const size = parseFloat(sizeStr);
      if (!Number.isFinite(price) || size <= 0) continue;
      bids.push([price, size]);
    }
    bids.sort((a, b) => b[0] - a[0]);

    const asks: PriceLevel[] = [];
    for (const [priceStr, sizeStr] of message.asks) {
      const price = parseFloat(priceStr);
      const size = parseFloat(sizeStr);
      if (!Number.isFinite(price) || size <= 0) continue;
      asks.push([price, size]);
    }
    asks.sort((a, b) => a[0] - b[0]);

    book.bids = bids;
    book.asks = asks;
    book.timestamp = timestamp;
  }

  snapshot(symbol: TradingSymbol): OrderBook | null {
    const book = this.state.get(symbol);
    if (!book) return null;

    // Arrays are pre-sorted by apply() — O(n) copy only, no sort here.
    return {
      symbol,
      bids: book.bids.slice(),
      asks: book.asks.slice(),
      sequence: -1,
      timestamp: book.timestamp,
    };
  }

  clear(symbol: TradingSymbol): void {
    this.state.delete(symbol);
  }

  isValidSequence(current: OrderBook, nextSequence: number): boolean {
    return nextSequence === current.sequence + 1;
  }
}
