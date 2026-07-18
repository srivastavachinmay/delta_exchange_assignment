import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import type { TradingSymbol } from '@/shared/types';
import { SYMBOL_CONFIG } from '@/shared/constants/symbols';

interface GroupingState {
  readonly steps: ReadonlyMap<TradingSymbol, number>;
}

interface GroupingActions {
  setStep(symbol: TradingSymbol, step: number): void;
  getStep(symbol: TradingSymbol): number;
  reset(): void;
}

type GroupingStore = GroupingState & GroupingActions;

export const useGroupingStore = create<GroupingStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      steps: new Map<TradingSymbol, number>(),

      setStep(symbol: TradingSymbol, step: number) {
        set(
          (prev) => {
            const next = new Map(prev.steps);
            next.set(symbol, step);
            return { steps: next as ReadonlyMap<TradingSymbol, number> };
          },
          false,
          'grouping/setStep',
        );
      },

      getStep(symbol: TradingSymbol): number {
        return get().steps.get(symbol) ?? SYMBOL_CONFIG[symbol].defaultGrouping;
      },

      reset() {
        set({ steps: new Map() }, false, 'grouping/reset');
      },
    })),
    { name: 'groupingStore' },
  ),
);
