import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import type { TradingSymbol } from '@/shared/types';
import type { OrderBookViewModel } from '@/domain/entities/OrderBookViewModel';

interface OrderBookViewState {
  readonly viewModels: ReadonlyMap<TradingSymbol, OrderBookViewModel>;
}

interface OrderBookViewActions {
  upsert(vm: OrderBookViewModel): void;
  upsertMany(vms: readonly OrderBookViewModel[]): void;
  reset(): void;
}

type OrderBookViewStore = OrderBookViewState & OrderBookViewActions;

export const useOrderBookViewStore = create<OrderBookViewStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      viewModels: new Map<TradingSymbol, OrderBookViewModel>(),

      upsert(vm: OrderBookViewModel) {
        set(
          (prev) => {
            const next = new Map(prev.viewModels);
            next.set(vm.symbol, vm);
            return { viewModels: next as ReadonlyMap<TradingSymbol, OrderBookViewModel> };
          },
          false,
          'orderBookView/upsert',
        );
      },

      upsertMany(vms: readonly OrderBookViewModel[]) {
        if (vms.length === 0) return;
        set(
          (prev) => {
            const next = new Map(prev.viewModels);
            for (const vm of vms) {
              next.set(vm.symbol, vm);
            }
            return { viewModels: next as ReadonlyMap<TradingSymbol, OrderBookViewModel> };
          },
          false,
          'orderBookView/upsertMany',
        );
      },

      reset() {
        set({ viewModels: new Map() }, false, 'orderBookView/reset');
      },
    })),
    { name: 'orderBookViewStore' },
  ),
);
