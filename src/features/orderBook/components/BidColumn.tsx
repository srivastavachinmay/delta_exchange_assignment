import { memo } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { useOrderBookViewStore } from '@/app/stores/orderBookViewStore';
import { OrderBookRow } from './OrderBookRow';
import styles from '../orderBook.module.css';

interface Props {
  readonly symbol: TradingSymbol;
  readonly precision: number;
  readonly baseAsset: string;
}

export const BidList = memo(function BidList({ symbol, precision, baseAsset }: Props) {
  const bids = useOrderBookViewStore((s) => s.viewModels.get(symbol)?.bids ?? EMPTY);

  // bids are sorted descending (best bid first = highest price = smallest cumulative).
  // Display as-is: best bid at top, closest to SpreadBar.
  return (
    <div className={styles.section}>
      <div className={styles.colHeader}>
        <span>Price (USD)</span>
        <span>Size ({baseAsset})</span>
        <span className={styles.colHeaderRight}>Total ({baseAsset})</span>
      </div>
      <div className={`${styles.rows} ${styles.rowsBid}`}>
        {bids.map((level) => (
          <OrderBookRow
            key={level.price}
            price={level.price}
            size={level.size}
            total={level.cumulativeSize}
            depthPercent={level.depthPercent}
            precision={precision}
            side="bid"
          />
        ))}
      </div>
    </div>
  );
});

const EMPTY = [] as const;
