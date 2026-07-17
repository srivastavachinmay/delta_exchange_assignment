import { useEffect } from 'react';
import { subscriptionManager } from '@/infrastructure/websocket/SubscriptionManager';
import { SUPPORTED_SYMBOLS } from '@/shared/constants/symbols';

export function useTickerSubscription(): void {
  useEffect(() => {
    SUPPORTED_SYMBOLS.forEach((symbol) => subscriptionManager.subscribe('ticker', symbol));
    return () => {
      SUPPORTED_SYMBOLS.forEach((symbol) => subscriptionManager.unsubscribe('ticker', symbol));
    };
  }, []);
}
