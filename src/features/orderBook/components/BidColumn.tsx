import { memo } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { useOrderBookStore } from '@/app/stores/orderBookStore';
import { OrderBookRow } from './OrderBookRow';
import styles from '../orderBook.module.css';

const MAX_ROWS = 10;

interface Props {
  readonly symbol: TradingSymbol;
  readonly precision: number;
  readonly baseAsset: string;
}

export const BidList = memo(function BidList({ symbol, precision, baseAsset }: Props) {
  const bids = useOrderBookStore((s) => s.books.get(symbol)?.bids);

  // Bids from snapshot() are sorted descending (best bid = highest price first).
  // Display as-is: best bid at top, closest to MidPriceBar.
  let displayBids: readonly [number, number, number][] = EMPTY;
  if (bids && bids.length > 0) {
    let cum = 0;
    displayBids = bids.slice(0, MAX_ROWS).map(([price, size]) => {
      cum += size;
      return [price, size, cum] as [number, number, number];
    });
  }

  return (
    <div className={styles.section}>
      <div className={styles.colHeader}>
        <span>Price (USD)</span>
        <span>Size ({baseAsset})</span>
        <span className={styles.colHeaderRight}>Total ({baseAsset})</span>
      </div>
      <div className={`${styles.rows} ${styles.rowsBid}`}>
        {displayBids.map(([price, size, total]) => (
          <OrderBookRow
            key={price}
            price={price}
            size={size}
            total={total}
            precision={precision}
            side="bid"
          />
        ))}
      </div>
    </div>
  );
});

const EMPTY: readonly [number, number, number][] = [];
