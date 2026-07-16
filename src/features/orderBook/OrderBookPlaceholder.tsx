/**
 * OrderBookPlaceholder — replaced in Phase 3.
 * Phase 3: live order book with depth visualization, grouping, and spread display.
 */
import styles from '@/shared/styles/placeholder.module.css';

export function OrderBookPlaceholder() {
  return (
    <div className={styles.panel} aria-label="Order book — Phase 3">
      <span>Order Book</span>
      <span className={styles.phase}>Phase 3</span>
    </div>
  );
}
