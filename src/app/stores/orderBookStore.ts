import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import type { TradingSymbol } from '@/shared/types';
import type { OrderBook } from '@/domain/entities/OrderBook';

interface OrderBookState {
  readonly books: ReadonlyMap<TradingSymbol, OrderBook>;
}

interface OrderBookActions {
  upsert(book: OrderBook): void;
  reset(): void;
}

type OrderBookStore = OrderBookState & OrderBookActions;

export const useOrderBookStore = create<OrderBookStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      books: new Map<TradingSymbol, OrderBook>(),

      upsert(book: OrderBook) {
        set(
          (prev) => {
            const next = new Map(prev.books);
            next.set(book.symbol, book);
            return { books: next as ReadonlyMap<TradingSymbol, OrderBook> };
          },
          false,
          'orderbook/upsert',
        );
      },

      reset() {
        set({ books: new Map() }, false, 'orderbook/reset');
      },
    })),
    { name: 'orderBookStore' },
  ),
);
