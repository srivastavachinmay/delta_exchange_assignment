/**
 * tickerStore — per-symbol ticker state.
 *
 * Render isolation guarantee:
 * A component subscribed to BTCUSD ticker will NOT re-render when ETHUSD
 * ticker updates, because it uses a selector:
 *
 *   const ticker = useTickerStore(s => s.tickers.get('BTCUSD'))
 *
 * Zustand's selector uses Object.is() — if the BTCUSD ticker reference
 * hasn't changed, the component doesn't re-render. The Map reference
 * changes on every update, but the individual entry reference only changes
 * when that specific symbol is updated.
 *
 * Written by: TickerPublisher (application layer).
 * Read by: TickerBar and ticker components.
 */

import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import type { TradingSymbol } from '@/shared/types';
import type { Ticker } from '@/domain/entities/Ticker';

interface TickerState {
  readonly tickers: ReadonlyMap<TradingSymbol, Ticker>;
}

interface TickerActions {
  upsert(ticker: Ticker): void;
  upsertMany(tickers: readonly Ticker[]): void;
  reset(): void;
}

type TickerStore = TickerState & TickerActions;

export const useTickerStore = create<TickerStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      tickers: new Map<TradingSymbol, Ticker>(),

      upsert(ticker: Ticker) {
        set(
          (prev) => {
            const next = new Map(prev.tickers);
            next.set(ticker.symbol, ticker);
            return { tickers: next as ReadonlyMap<TradingSymbol, Ticker> };
          },
          false,
          'ticker/upsert',
        );
      },

      upsertMany(tickers: readonly Ticker[]) {
        if (tickers.length === 0) return;
        set(
          (prev) => {
            const next = new Map(prev.tickers);
            for (const t of tickers) next.set(t.symbol, t);
            return { tickers: next as ReadonlyMap<TradingSymbol, Ticker> };
          },
          false,
          'ticker/upsertMany',
        );
      },

      reset() {
        set({ tickers: new Map() }, false, 'ticker/reset');
      },
    })),
    { name: 'tickerStore' },
  ),
);
