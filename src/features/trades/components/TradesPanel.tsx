import { memo, useState, useRef, useCallback } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { getSymbolConfig } from '@/shared/constants/symbols';
import { LARGE_TRADE_THRESHOLDS } from '../config';
import { TradesStatsBar } from './TradesStatsBar';
import { TradeList } from './TradeList';
import type { TradeListHandle } from './TradeList';
import { TradeFooter } from './TradeFooter';
import styles from '../trades.module.css';

interface Props {
  readonly symbol: TradingSymbol;
}

export const TradesPanel = memo(function TradesPanel({ symbol }: Props) {
  const config = getSymbolConfig(symbol);
  const baseAsset = symbol.replace('USD', '');
  const [isScrollPaused, setIsScrollPaused] = useState(false);
  const tradeListRef = useRef<TradeListHandle>(null);

  const handleJumpToLatest = useCallback(() => {
    tradeListRef.current?.scrollToLatest();
  }, []);

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
        ref={tradeListRef}
        symbol={symbol}
        precision={config.displayPrecision}
        largeTradeValue={LARGE_TRADE_THRESHOLDS[symbol]}
        onPausedChange={setIsScrollPaused}
      />
      <TradeFooter isVisible={isScrollPaused} onJumpToLatest={handleJumpToLatest} />
    </div>
  );
});
