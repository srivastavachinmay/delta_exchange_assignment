import { memo } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { useOrderBookViewStore } from '@/app/stores/orderBookViewStore';
import styles from '../orderBook.module.css';

interface Props {
  readonly symbol: TradingSymbol;
}

export const ImbalanceBar = memo(function ImbalanceBar({ symbol }: Props) {
  const imbalance = useOrderBookViewStore((s) => s.viewModels.get(symbol)?.imbalance ?? null);

  if (imbalance === null) return null;

  const bidPct = (imbalance * 100).toFixed(1);
  const askPct = ((1 - imbalance) * 100).toFixed(1);

  return (
    <div className={styles.imbalanceBar}>
      <span className={`${styles.imbalanceStat} ${styles.imbalanceBidStat}`}>B {bidPct}%</span>
      <div className={styles.imbalanceTrack}>
        <div className={styles.imbalanceFill} style={{ width: `${bidPct}%` }} />
      </div>
      <span className={`${styles.imbalanceStat} ${styles.imbalanceAskStat}`}>A {askPct}%</span>
    </div>
  );
});
