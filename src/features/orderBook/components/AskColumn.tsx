import { memo, useMemo } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { useOrderBookViewStore } from '@/app/stores/orderBookViewStore';
import { OrderBookRow } from './OrderBookRow';
import styles from '../orderBook.module.css';

interface Props {
  readonly symbol: TradingSymbol;
  readonly precision: number;
  readonly baseAsset: string;
}

export const AskList = memo(function AskList({ symbol, precision, baseAsset }: Props) {
  const asks = useOrderBookViewStore((s) => s.viewModels.get(symbol)?.asks ?? EMPTY);

  // asks are sorted ascending (best ask = lowest price first, smallest cumulative first).
  // Reverse for display: highest price at top, best ask at bottom adjacent to SpreadBar.
  const displayAsks = useMemo(() => [...asks].reverse(), [asks]);

  return (
    <div className={styles.section}>
      <div className={styles.colHeader}>
        <span>Total ({baseAsset})</span>
        <span>Size ({baseAsset})</span>
        <span className={styles.colHeaderRight}>Price (USD)</span>
      </div>
      <div className={`${styles.rows} ${styles.rowsAsk}`}>
        {displayAsks.map((level) => (
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

const EMPTY = [] as const;
