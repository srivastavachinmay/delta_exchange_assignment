import { memo } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { getSymbolConfig } from '@/shared/constants/symbols';
import { LARGE_TRADE_THRESHOLDS } from '../config';
import { TradesStatsBar } from './TradesStatsBar';
import { TradeList } from './TradeList';
import styles from '../trades.module.css';

interface Props {
  readonly symbol: TradingSymbol;
}

export const TradesPanel = memo(function TradesPanel({ symbol }: Props) {
  const config = getSymbolConfig(symbol);
  const baseAsset = symbol.replace('USD', '');

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Recent Trades — {symbol}</span>
        <span className={styles.liveBadge}>LIVE</span>
      </div>
      <TradesStatsBar symbol={symbol} baseAsset={baseAsset} />
      <div className={styles.colHeader}>
        <span>Time</span>
        <span className={styles.colRight}>Price (USD)</span>
        <span className={styles.colRight}>Size ({baseAsset})</span>
      </div>
      <TradeList
        symbol={symbol}
        precision={config.displayPrecision}
        largeTradeValue={LARGE_TRADE_THRESHOLDS[symbol]}
      />
    </div>
  );
});
