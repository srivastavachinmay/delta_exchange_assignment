import { ConnectionStatusBar } from '@/features/status/ConnectionStatusBar';
import { TickerPlaceholder } from '@/features/ticker/TickerPlaceholder';
import { OrderBookPlaceholder } from '@/features/orderBook/OrderBookPlaceholder';
import { TradesPlaceholder } from '@/features/trades/TradesPlaceholder';
import styles from './AppShell.module.css';

/**
 * AppShell — grid layout shell. Presentational only.
 *
 * Each grid area holds a feature panel. Features are independent —
 * they import from their own stores only, never from each other.
 * This enforces the render isolation contract at the module level.
 *
 * Phase 2/3/4: replace Placeholder components with real implementations.
 */
export function AppShell() {
  return (
    <div className={styles.shell}>
      <div className={styles.statusArea}>
        <ConnectionStatusBar />
      </div>

      <div className={styles.tickerArea}>
        <TickerPlaceholder />
      </div>

      <div className={styles.bookArea}>
        <OrderBookPlaceholder />
      </div>

      <div className={styles.tradesArea}>
        <TradesPlaceholder />
      </div>
    </div>
  );
}
