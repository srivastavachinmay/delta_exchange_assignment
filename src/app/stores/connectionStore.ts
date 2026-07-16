/**
 * connectionStore — tracks WebSocket connection lifecycle.
 *
 * Written by: WebSocketManager (infrastructure) via setStatus/setError.
 * Read by: ConnectionStatusBar (features) via useConnectionStore(selector).
 *
 * Render isolation:
 * Components subscribe to individual fields via selectors.
 * A reconnect attempt counter change does NOT re-render components
 * that only subscribe to `connected`.
 *
 * subscribeWithSelector enables external (non-hook) subscriptions:
 *   useConnectionStore.subscribe(s => s.status, callback)
 * This is used by the application layer to react to connection changes
 * without React hooks (e.g., triggering re-subscriptions on reconnect).
 */

import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import type { ConnectionState, ConnectionStatus } from '@/shared/types';

interface ConnectionActions {
  setStatus(status: ConnectionStatus): void;
  setConnected(connectedAt: number): void;
  setReconnecting(attempt: number): void;
  setError(message: string): void;
  reset(): void;
}

type ConnectionStore = ConnectionState & ConnectionActions;

const INITIAL: ConnectionState = {
  status: 'idle',
  connected: false,
  reconnecting: false,
  reconnectAttempt: 0,
  error: null,
  connectedAt: null,
};

export const useConnectionStore = create<ConnectionStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      ...INITIAL,

      setStatus(status: ConnectionStatus) {
        set(
          (prev) => ({
            status,
            connected: status === 'connected',
            reconnecting: status === 'reconnecting',
            error: status !== 'error' ? null : prev.error,
          }),
          false,
          'connection/setStatus',
        );
      },

      setConnected(connectedAt: number) {
        set(
          {
            status: 'connected',
            connected: true,
            reconnecting: false,
            reconnectAttempt: 0,
            error: null,
            connectedAt,
          },
          false,
          'connection/setConnected',
        );
      },

      setReconnecting(attempt: number) {
        set(
          {
            status: 'reconnecting',
            connected: false,
            reconnecting: true,
            reconnectAttempt: attempt,
          },
          false,
          'connection/setReconnecting',
        );
      },

      setError(message: string) {
        set(
          {
            status: 'error',
            connected: false,
            reconnecting: false,
            error: message,
          },
          false,
          'connection/setError',
        );
      },

      reset() {
        set(INITIAL, false, 'connection/reset');
      },
    })),
    { name: 'connectionStore' },
  ),
);
