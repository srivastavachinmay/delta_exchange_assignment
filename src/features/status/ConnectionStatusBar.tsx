import { memo } from 'react';
import { useConnectionStore } from '@/app/stores/connectionStore';
import { useSubscriptionStore } from '@/app/stores/subscriptionStore';
import styles from './ConnectionStatusBar.module.css';

const STATUS_LABELS: Record<string, string> = {
  idle: 'Disconnected',
  connecting: 'Connecting',
  connected: 'Connected',
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected',
  error: 'Error',
};

export const ConnectionStatusBar = memo(function ConnectionStatusBar() {
  const status = useConnectionStore((s) => s.status);
  const reconnectAttempt = useConnectionStore((s) => s.reconnectAttempt);
  const error = useConnectionStore((s) => s.error);
  const activeCount = useSubscriptionStore((s) => s.subscriptions.size);
  const desiredCount = useSubscriptionStore((s) => s.desired.size);

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

      {desiredCount > 0 && (
        <span className={styles.subscriptionCount}>
          {activeCount}/{desiredCount} channels
        </span>
      )}

      <div className={styles.spacer} />
      <span className={styles.brand}>Delta Exchange</span>
    </div>
  );
});
