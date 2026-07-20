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

export const AskList = memo(function AskList({ symbol, precision, baseAsset }: Props) {
  // asks are stored in display order (highest price first, best ask last) — no reversal needed.
  const asks = useStoreWithEqualityFn(useOrderBookViewStore, (s) => s.viewModels.get(symbol)?.asks ?? EMPTY, levelsEqual);

  return (
    <div className={styles.section}>
      <div className={styles.colHeader}>
        <span>Total ({baseAsset})</span>
        <span>Size ({baseAsset})</span>
        <span className={styles.colHeaderRight}>Price (USD)</span>
      </div>
      <div className={`${styles.rows} ${styles.rowsAsk}`}>
        {asks.map((level) => (
          <OrderBookRow
            key={level.price}
            price={level.price}
            size={level.size}
            total={level.cumulativeSize}
            depthPercent={level.depthPercent}
            precision={precision}
            side="ask"
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
