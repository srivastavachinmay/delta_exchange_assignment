import type { RawOrderBookMessage, TradingSymbol } from '@/shared/types';
import type { OrderBook, PriceLevel } from '../entities/OrderBook';

interface SymbolBook {
  bids: Map<number, number>;
  asks: Map<number, number>;
  timestamp: number;
}

export class OrderBookEngine {
  private readonly state = new Map<TradingSymbol, SymbolBook>();

  apply(message: RawOrderBookMessage): void {
    const { symbol, timestamp } = message;

    let book = this.state.get(symbol);
    if (!book) {
      book = { bids: new Map(), asks: new Map(), timestamp };
      this.state.set(symbol, book);
    }

    // Delta Exchange sends full snapshots on every l2_orderbook message.
    // Clear before repopulating so the Maps stay bounded at ~500 entries
    // instead of accumulating all historical price levels unboundedly.
    book.bids.clear();
    book.asks.clear();

    for (const [priceStr, sizeStr] of message.bids) {
      const price = parseFloat(priceStr);
      const size = parseFloat(sizeStr);
      if (!Number.isFinite(price)) continue;
      if (size <= 0) {
        book.bids.delete(price);
      } else {
        book.bids.set(price, size);
      }
    }

    for (const [priceStr, sizeStr] of message.asks) {
      const price = parseFloat(priceStr);
      const size = parseFloat(sizeStr);
      if (!Number.isFinite(price)) continue;
      if (size <= 0) {
        book.asks.delete(price);
      } else {
        book.asks.set(price, size);
      }
    }

    book.timestamp = timestamp;
  }

  snapshot(symbol: TradingSymbol): OrderBook | null {
    const book = this.state.get(symbol);
    if (!book) return null;

    const bids: PriceLevel[] = [];
    for (const [price, size] of book.bids) {
      bids.push([price, size]);
    }
    bids.sort((a, b) => b[0] - a[0]);

    const asks: PriceLevel[] = [];
    for (const [price, size] of book.asks) {
      asks.push([price, size]);
    }
    asks.sort((a, b) => a[0] - b[0]);

    return { symbol, bids, asks, sequence: -1, timestamp: book.timestamp };
  }

  clear(symbol: TradingSymbol): void {
    this.state.delete(symbol);
  }

  isValidSequence(current: OrderBook, nextSequence: number): boolean {
    return nextSequence === current.sequence + 1;
  }
}
