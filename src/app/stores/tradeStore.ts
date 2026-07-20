import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import type { TradingSymbol } from '@/shared/types';
import type { TradeSnapshot } from '@/domain/entities/Trade';

interface TradeState {
  readonly snapshots: ReadonlyMap<TradingSymbol, TradeSnapshot>;
}

interface TradeActions {
  upsert(snapshot: TradeSnapshot): void;
  upsertMany(snapshots: readonly TradeSnapshot[]): void;
  reset(): void;
}

type TradeStore = TradeState & TradeActions;

export const useTradeStore = create<TradeStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      snapshots: new Map<TradingSymbol, TradeSnapshot>(),

      upsert(snapshot: TradeSnapshot) {
        const next = new Map(get().snapshots);
        next.set(snapshot.symbol, snapshot);
        set({ snapshots: next }, false, 'trade/upsert');
      },

      upsertMany(snapshots: readonly TradeSnapshot[]) {
        if (snapshots.length === 0) return;
        const next = new Map(get().snapshots);
        for (const s of snapshots) {
          next.set(s.symbol, s);
        }
        set({ snapshots: next }, false, 'trade/upsertMany');
      },

      reset() {
        set({ snapshots: new Map() }, false, 'trade/reset');
      },
    })),
    { name: 'tradeStore' },
  ),
);
