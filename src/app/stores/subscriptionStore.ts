/**
 * subscriptionStore — server-acknowledged subscriptions only.
 *
 * A symbol+channel pair appears here ONLY after the server sends a 'subscribed' ack.
 * Pending (optimistic, not yet acked) subscriptions exist only in WebSocketManager.
 *
 * Render isolation:
 * Components check isSubscribed(symbol, channel) via a granular selector.
 * A new subscription for ETHUSD does NOT re-render components watching BTCUSD.
 *
 * Written by: SubscriptionHandler (application layer).
 * Read by: feature components to gate data display.
 */

import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import type { Channel, Subscription, SubscriptionKey, TradingSymbol } from '@/shared/types';
import { makeSubscriptionKey } from '@/shared/types';

interface SubscriptionState {
  readonly subscriptions: ReadonlyMap<SubscriptionKey, Subscription>;
}

interface SubscriptionActions {
  acknowledge(symbols: TradingSymbol[], channels: Channel[]): void;
  remove(symbols: TradingSymbol[], channels: Channel[]): void;
  isSubscribed(symbol: TradingSymbol, channel: Channel): boolean;
  reset(): void;
}

type SubscriptionStore = SubscriptionState & SubscriptionActions;

export const useSubscriptionStore = create<SubscriptionStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      subscriptions: new Map<SubscriptionKey, Subscription>(),

      acknowledge(symbols, channels) {
        const now = Date.now();
        const next = new Map(get().subscriptions);

        for (const symbol of symbols) {
          for (const channel of channels) {
            next.set(makeSubscriptionKey(symbol, channel), {
              symbol,
              channel,
              acknowledgedAt: now,
            });
          }
        }

        set({ subscriptions: next }, false, 'subscription/acknowledge');
      },

      remove(symbols, channels) {
        const next = new Map(get().subscriptions);

        for (const symbol of symbols) {
          for (const channel of channels) {
            next.delete(makeSubscriptionKey(symbol, channel));
          }
        }

        set({ subscriptions: next }, false, 'subscription/remove');
      },

      isSubscribed(symbol, channel) {
        return get().subscriptions.has(makeSubscriptionKey(symbol, channel));
      },

      reset() {
        set({ subscriptions: new Map() }, false, 'subscription/reset');
      },
    })),
    { name: 'subscriptionStore' },
  ),
);
