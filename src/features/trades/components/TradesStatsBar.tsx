import { memo } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { useTradeStore } from '@/app/stores/tradeStore';
import { formatSize } from '../tradeFormatters';
import styles from '../trades.module.css';

interface Props {
  readonly symbol: TradingSymbol;
  readonly baseAsset: string;
}

const EMPTY_STATS = { volume1mBuy: 0, volume1mSell: 0, count1m: 0, avgSize1m: 0 };

export const TradesStatsBar = memo(function TradesStatsBar({ symbol, baseAsset }: Props) {
  const stats = useTradeStore((s) => s.snapshots.get(symbol)?.stats ?? EMPTY_STATS);

  return (
    <div className={styles.statsBar}>
      <div className={styles.statCell}>
        <span className={styles.statLabel}>1m Volume</span>
        <span className={styles.statValue}>
          <span className={styles.statBuy}>{formatSize(stats.volume1mBuy, 3)} buy</span>
          {' '}
          <span className={styles.statSell}>{formatSize(stats.volume1mSell, 3)} sell</span>
        </span>
      </div>
      <div className={styles.statCell}>
        <span className={styles.statLabel}>1m Trades</span>
        <span className={styles.statValue}>{stats.count1m}</span>
      </div>
      <div className={`${styles.statCell} ${styles.statCellRight}`}>
        <span className={styles.statLabel}>Avg Size</span>
        <span className={styles.statValue}>{formatSize(stats.avgSize1m, 3)} {baseAsset}</span>
      </div>
    </div>
  );
});
