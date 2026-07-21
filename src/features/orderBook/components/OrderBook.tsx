import { memo } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { getSymbolConfig } from '@/shared/constants/symbols';
import { AskList } from './AskColumn';
import { BidList } from './BidColumn';
import { MidPriceBar } from './MidPriceBar';
import { SpreadBar } from './SpreadBar';
import { GroupingControl } from './GroupingControl';
import { ImbalanceBar } from './ImbalanceBar';
import styles from '../orderBook.module.css';

interface Props {
  readonly symbol: TradingSymbol;
}

export const OrderBook = memo(function OrderBook({ symbol }: Props) {
  const config = getSymbolConfig(symbol);
  const baseAsset = symbol.replace('USD', '');

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Order Book — {symbol}</span>
        <span className={styles.liveBadge}>LIVE</span>
        <GroupingControl symbol={symbol} />
      </div>
      <AskList symbol={symbol} precision={config.displayPrecision} baseAsset={baseAsset} />
      <SpreadBar symbol={symbol} precision={config.displayPrecision} />
      <MidPriceBar symbol={symbol} precision={config.displayPrecision} />
      <ImbalanceBar symbol={symbol} />
      <BidList symbol={symbol} precision={config.displayPrecision} baseAsset={baseAsset} />
    </div>
  );
});
