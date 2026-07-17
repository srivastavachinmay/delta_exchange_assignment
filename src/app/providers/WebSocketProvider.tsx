import { useEffect, type ReactNode } from 'react';
import { wsManager } from '@/infrastructure/websocket/WebSocketManager';
import { SubscriptionManager } from '@/infrastructure/websocket/SubscriptionManager';
import { WebSocketAdapter } from '@/infrastructure/websocket/WebSocketAdapter';
import { MessageRouter } from '@/application/MessageRouter';
import { SubscriptionHandler } from '@/application/SubscriptionHandler';
import { useConnectionStore } from '@/app/stores/connectionStore';
import { useSubscriptionStore } from '@/app/stores/subscriptionStore';

interface Props {
  readonly children: ReactNode;
}

export function WebSocketProvider({ children }: Props) {
  useEffect(() => {
    const subscriptionHandler = new SubscriptionHandler({
      onAcknowledge: (symbols, channels) =>
        useSubscriptionStore.getState().acknowledge(symbols, channels),
      onRemove: (symbols, channels) =>
        useSubscriptionStore.getState().remove(symbols, channels),
    });

    const router = new MessageRouter(subscriptionHandler);

    const subscriptionManager = new SubscriptionManager(wsManager);
    subscriptionManager.setCallbacks({
      onDesiredAdded: (symbols, channel) =>
        useSubscriptionStore.getState().addDesired(symbols, [channel]),
      onDesiredRemoved: (symbols, channel) =>
        useSubscriptionStore.getState().removeDesired(symbols, [channel]),
    });

    const adapter = new WebSocketAdapter(router, wsManager, subscriptionManager);
    adapter.initialize();

    wsManager.setStatusCallbacks({
      onStatus: (status) => useConnectionStore.getState().setStatus(status),
      onConnected: (connectedAt) => useConnectionStore.getState().setConnected(connectedAt),
      onReconnecting: (attempt) => useConnectionStore.getState().setReconnecting(attempt),
      onError: (message) => useConnectionStore.getState().setError(message),
    });

    wsManager.connect();

    return () => {
      adapter.cleanup();
      wsManager.disconnect();
      useConnectionStore.getState().reset();
      useSubscriptionStore.getState().reset();
    };
  }, []);

  return <>{children}</>;
}
