import { memo } from 'react';
import { useConnectionStore } from '@/app/stores/connectionStore';
import styles from './ConnectionStatusBar.module.css';

const STATUS_LABELS: Record<string, string> = {
  idle: 'Idle',
  connecting: 'Connecting',
  connected: 'Live',
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected',
  error: 'Error',
};

/**
 * ConnectionStatusBar — live connection state indicator.
 *
 * memo'd: only re-renders when the connection store slice changes.
 * Uses granular Zustand selectors — a ticker update CANNOT cause this to re-render.
 *
 * Reading from connectionStore (not from WebSocketManager) ensures the UI
 * reflects server-confirmed state, not optimistic client state.
 */
export const ConnectionStatusBar = memo(function ConnectionStatusBar() {
  const status = useConnectionStore((s) => s.status);
  const reconnectAttempt = useConnectionStore((s) => s.reconnectAttempt);
  const error = useConnectionStore((s) => s.error);

  return (
    <div className={styles.bar} role="status" aria-live="polite">
      <div className={styles.dot} data-status={status} aria-hidden="true" />

      <span className={styles.label} data-status={status}>
        {STATUS_LABELS[status] ?? status}
      </span>

      {status === 'reconnecting' && (
        <span className={styles.reconnectHint}>
          attempt {reconnectAttempt}
        </span>
      )}

      {status === 'error' && error && (
        <span className={styles.errorMessage}>{error}</span>
      )}

      <div className={styles.spacer} />
      <span className={styles.brand}>Delta Exchange</span>
    </div>
  );
});
