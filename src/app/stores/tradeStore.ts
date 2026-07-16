/**
 * tradeStore — per-symbol recent trade history.
 *
 * Render isolation guarantee:
 * The Trades panel subscribes only to its symbol's trades:
 *
 *   const trades = useTradeStore(s => s.trades.get(focusedSymbol))
 *
 * Implemented as a capped array (ring buffer in Phase 4).
 * Default capacity: 200 entries — enough for a scrollable panel without
 * unbounded memory growth. At 20 trades/sec, this is ~10 seconds of history.
 *
 * Phase 4: add append() action backed by TradeEngine.
 *
 * Written by: TradesHandler (Phase 4, application layer).
 * Read by: Trades panel component.
 */

import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import type { TradingSymbol } from '@/shared/types';
import type { Trade } from '@/domain/entities/Trade';

interface TradeState {
  readonly trades: ReadonlyMap<TradingSymbol, readonly Trade[]>;
}

interface TradeActions {
  // Phase 4: append(symbol: TradingSymbol, incoming: readonly Trade[]): void
  reset(): void;
}

type TradeStore = TradeState & TradeActions;

export const useTradeStore = create<TradeStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      trades: new Map<TradingSymbol, readonly Trade[]>(),

      reset() {
        set({ trades: new Map() }, false, 'trade/reset');
      },
    })),
    { name: 'tradeStore' },
  ),
);
