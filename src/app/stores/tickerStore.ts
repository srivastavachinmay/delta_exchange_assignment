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
 * Written by: TickerHandler (Phase 2, application layer).
 * Read by: TickerStrip and ticker panel components.
 *
 * Phase 2: add upsert() action and implement Ticker entity type.
 */

import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import type { TradingSymbol } from '@/shared/types';
import type { Ticker } from '@/domain/entities/Ticker';

interface TickerState {
  readonly tickers: ReadonlyMap<TradingSymbol, Ticker>;
}

interface TickerActions {
  // Phase 2: upsert(ticker: Ticker): void
  reset(): void;
}

type TickerStore = TickerState & TickerActions;

export const useTickerStore = create<TickerStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      tickers: new Map<TradingSymbol, Ticker>(),

      reset() {
        set({ tickers: new Map() }, false, 'ticker/reset');
      },
    })),
    { name: 'tickerStore' },
  ),
);
