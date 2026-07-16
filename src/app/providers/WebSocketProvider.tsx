/**
 * WebSocketProvider — manages WebSocket connection lifecycle.
 *
 * A React provider (not a context — no value is passed down) that:
 * 1. Connects the WS on mount
 * 2. Disconnects on unmount (prevents orphaned connections in dev StrictMode)
 *
 * Lives in app/ because it's bootstrap infrastructure, not a feature.
 * The actual WS singleton lives in infrastructure/ — this is only the
 * React lifecycle bridge.
 *
 * StrictMode note:
 * React 19 StrictMode mounts → unmounts → remounts in development.
 * WebSocketManager.connect() is idempotent (guards against double-connect),
 * so the double-mount is safe.
 */

import { useEffect, type ReactNode } from 'react';
import { wsManager } from '@/infrastructure/websocket/WebSocketManager';

interface Props {
  readonly children: ReactNode;
}

export function WebSocketProvider({ children }: Props) {
  useEffect(() => {
    wsManager.connect();
    return () => wsManager.disconnect();
  }, []);

  return <>{children}</>;
}
