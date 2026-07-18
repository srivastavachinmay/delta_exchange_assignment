import { useEffect } from 'react';
import { subscriptionManager } from '@/infrastructure/websocket/SubscriptionManager';
import { useFocusedSymbolStore } from '@/app/stores/focusedSymbolStore';
import { useOrderBookStore } from '@/app/stores/orderBookStore';

export function useOrderBookSubscription(): void {
  const focusedSymbol = useFocusedSymbolStore((s) => s.focusedSymbol);

  useEffect(() => {
    subscriptionManager.subscribe('orderbook', focusedSymbol);
    return () => {
      subscriptionManager.unsubscribe('orderbook', focusedSymbol);
      useOrderBookStore.getState().reset();
    };
  }, [focusedSymbol]);
}
