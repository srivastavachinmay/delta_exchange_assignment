/**
 * Connection state types.
 * Owned by the connection store. Written by ConnectionHandler (infrastructure).
 * Read by UI components via useConnectionStore.
 */

export type ConnectionStatus =
  | 'idle'          // initial state, never connected
  | 'connecting'    // first connection attempt in progress
  | 'connected'     // WS open, heartbeat running
  | 'reconnecting'  // abnormal close, backoff in progress
  | 'disconnected'  // intentional disconnect
  | 'error';        // max retries exhausted or fatal error

export interface ConnectionState {
  readonly status: ConnectionStatus;
  readonly connected: boolean;
  readonly reconnecting: boolean;
  /** How many reconnect attempts in the current backoff cycle. */
  readonly reconnectAttempt: number;
  readonly error: string | null;
  /** Unix ms of last successful connection. Null if never connected. */
  readonly connectedAt: number | null;
}
