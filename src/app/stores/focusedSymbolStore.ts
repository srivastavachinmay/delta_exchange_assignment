import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import type { TradingSymbol } from '@/shared/types';

interface FocusedSymbolState {
  readonly focusedSymbol: TradingSymbol;
}

interface FocusedSymbolActions {
  setFocusedSymbol(symbol: TradingSymbol): void;
}

type FocusedSymbolStore = FocusedSymbolState & FocusedSymbolActions;

export const useFocusedSymbolStore = create<FocusedSymbolStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      focusedSymbol: 'BTCUSD' as TradingSymbol,

      setFocusedSymbol(symbol: TradingSymbol) {
        set({ focusedSymbol: symbol }, false, 'focusedSymbol/set');
      },
    })),
    { name: 'focusedSymbolStore' },
  ),
);
