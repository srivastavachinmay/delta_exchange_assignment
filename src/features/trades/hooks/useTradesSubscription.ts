import { useEffect } from 'react';
import { subscriptionManager } from '@/infrastructure/websocket/SubscriptionManager';
import { useFocusedSymbolStore } from '@/app/stores/focusedSymbolStore';
import { useTradeStore } from '@/app/stores/tradeStore';

export function useTradesSubscription(): void {
  const focusedSymbol = useFocusedSymbolStore((s) => s.focusedSymbol);

  useEffect(() => {
    subscriptionManager.subscribe('trades', focusedSymbol);
    return () => {
      subscriptionManager.unsubscribe('trades', focusedSymbol);
      useTradeStore.getState().reset();
    };
  }, [focusedSymbol]);
}
