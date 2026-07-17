import { ConnectionStatusBar } from '@/features/status/ConnectionStatusBar';
import { TickerBar } from '@/features/ticker/components/TickerBar';
import { OrderBookPlaceholder } from '@/features/orderBook/OrderBookPlaceholder';
import { TradesPlaceholder } from '@/features/trades/TradesPlaceholder';
import styles from './AppShell.module.css';

/**
 * AppShell — grid layout and composition root for all feature panels.
 *
 * Lives in app/ because its role is composition: wiring feature panels into
 * the layout grid. Features are independent — they import only from their own
 * stores, never from each other. Cross-panel coordination goes through the
 * Application Layer, not through this component.
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
        <TickerBar />
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
