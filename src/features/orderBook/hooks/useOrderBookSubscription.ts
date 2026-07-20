import { useEffect } from 'react';
import { subscriptionManager } from '@/infrastructure/websocket/SubscriptionManager';
import { useFocusedSymbolStore } from '@/app/stores/focusedSymbolStore';
import { useOrderBookViewStore } from '@/app/stores/orderBookViewStore';

export function useOrderBookSubscription(): void {
  const focusedSymbol = useFocusedSymbolStore((s) => s.focusedSymbol);

  useEffect(() => {
    subscriptionManager.subscribe('orderbook', focusedSymbol);
    return () => {
      subscriptionManager.unsubscribe('orderbook', focusedSymbol);
      useOrderBookViewStore.getState().reset();
    };
  }, [focusedSymbol]);
}
