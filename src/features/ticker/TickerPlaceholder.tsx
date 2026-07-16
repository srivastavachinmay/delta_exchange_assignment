/**
 * TickerPlaceholder — replaced in Phase 2.
 * Phase 2: TickerStrip with real-time price data for all supported symbols.
 */
import styles from './ticker.module.css';

export function TickerPlaceholder() {
  return (
    <div className={styles.placeholder} aria-label="Ticker strip — Phase 2">
      <span className={styles.label}>Ticker Strip</span>
      <span className={styles.phase}>Phase 2</span>
    </div>
  );
}
