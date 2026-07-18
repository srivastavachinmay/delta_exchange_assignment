import type { TradingSymbol } from '@/shared/types';
import { getSymbolConfig } from '@/shared/constants/symbols';
import { AskList } from './AskColumn';
import { BidList } from './BidColumn';
import { MidPriceBar } from './MidPriceBar';
import styles from '../orderBook.module.css';

interface Props {
  readonly symbol: TradingSymbol;
}

export function OrderBook({ symbol }: Props) {
  const config = getSymbolConfig(symbol);
  const baseAsset = symbol.replace('USD', '');

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Order Book — {symbol}</span>
        <span className={styles.liveBadge}>LIVE</span>
      </div>
      <AskList symbol={symbol} precision={config.displayPrecision} baseAsset={baseAsset} />
      <MidPriceBar symbol={symbol} precision={config.displayPrecision} />
      <BidList symbol={symbol} precision={config.displayPrecision} baseAsset={baseAsset} />
    </div>
  );
}
