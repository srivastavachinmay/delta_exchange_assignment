import { useEffect, type ReactNode } from 'react';
import { wsManager } from '@/infrastructure/websocket/WebSocketManager';
import { useConnectionStore } from '@/app/stores/connectionStore';

interface Props {
  readonly children: ReactNode;
}

export function WebSocketProvider({ children }: Props) {
  useEffect(() => {
    wsManager.setStatusCallbacks({
      onStatus: (status) => useConnectionStore.getState().setStatus(status),
      onConnected: (connectedAt) => useConnectionStore.getState().setConnected(connectedAt),
      onReconnecting: (attempt) => useConnectionStore.getState().setReconnecting(attempt),
      onError: (message) => useConnectionStore.getState().setError(message),
    });
    wsManager.connect();
    return () => wsManager.disconnect();
  }, []);

  return <>{children}</>;
}
