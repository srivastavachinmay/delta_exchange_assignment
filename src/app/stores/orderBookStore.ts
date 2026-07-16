/**
 * orderBookStore — per-symbol order book state.
 *
 * Render isolation guarantee:
 * The OrderBook component subscribes only to its symbol's book:
 *
 *   const book = useOrderBookStore(s => s.books.get(focusedSymbol))
 *
 * Ticker updates → tickerStore → never touches this store → no re-render.
 * Trades updates → tradeStore → never touches this store → no re-render.
 *
 * Phase 3: add applySnapshot() and applyDelta() actions.
 * These will call OrderBookEngine and write the resulting entity here.
 *
 * Written by: OrderBookHandler (Phase 3, application layer).
 * Read by: OrderBook panel component.
 */

import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import type { TradingSymbol } from '@/shared/types';
import type { OrderBook } from '@/domain/entities/OrderBook';

interface OrderBookState {
  readonly books: ReadonlyMap<TradingSymbol, OrderBook>;
}

interface OrderBookActions {
  // Phase 3: applySnapshot(book: OrderBook): void
  // Phase 3: applyDelta(symbol: TradingSymbol, delta: RawOrderBookMessage): void
  reset(): void;
}

type OrderBookStore = OrderBookState & OrderBookActions;

export const useOrderBookStore = create<OrderBookStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      books: new Map<TradingSymbol, OrderBook>(),

      reset() {
        set({ books: new Map() }, false, 'orderbook/reset');
      },
    })),
    { name: 'orderBookStore' },
  ),
);
