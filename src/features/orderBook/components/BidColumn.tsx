import { memo } from 'react';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import type { TradingSymbol } from '@/shared/types';
import type { DepthLevel } from '@/domain/calculations/Depth';
import { useOrderBookViewStore } from '@/app/stores/orderBookViewStore';
import { OrderBookRow } from './OrderBookRow';
import styles from '../orderBook.module.css';

interface Props {
  readonly symbol: TradingSymbol;
  readonly precision: number;
  readonly baseAsset: string;
}

export const BidList = memo(function BidList({ symbol, precision, baseAsset }: Props) {
  const bids = useStoreWithEqualityFn(useOrderBookViewStore, (s) => s.viewModels.get(symbol)?.bids ?? EMPTY, levelsEqual);

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

const EMPTY: readonly DepthLevel[] = [];

function levelsEqual(a: readonly DepthLevel[], b: readonly DepthLevel[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const la = a[i]!, lb = b[i]!;
    if (la.price !== lb.price || la.size !== lb.size || la.cumulativeSize !== lb.cumulativeSize || la.depthPercent !== lb.depthPercent) return false;
  }
  return true;
}
