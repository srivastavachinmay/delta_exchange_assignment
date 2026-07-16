/**
 * TradesPlaceholder — replaced in Phase 4.
 * Phase 4: real-time trade tape with side coloring and virtual scroll.
 */
import styles from '@/shared/styles/placeholder.module.css';

export function TradesPlaceholder() {
  return (
    <div className={styles.panel} aria-label="Recent trades — Phase 4">
      <span>Recent Trades</span>
      <span className={styles.phase}>Phase 4</span>
    </div>
  );
}
