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

export const AskList = memo(function AskList({ symbol, precision, baseAsset }: Props) {
  const asks = useOrderBookStore((s) => s.books.get(symbol)?.asks);

  // Asks from snapshot() are sorted ascending (best ask = lowest price first).
  // Take the best MAX_ROWS, reverse so the highest price appears at top
  // and the best ask (closest to mid) sits at the bottom, adjacent to MidPriceBar.
  let displayAsks: readonly [number, number, number][] = EMPTY;
  if (asks && asks.length > 0) {
    const sliced = asks.slice(0, MAX_ROWS);
    let cum = 0;
    const pairs: [number, number, number][] = sliced.map(([price, size]) => {
      cum += size;
      return [price, size, cum];
    });
    pairs.reverse();
    displayAsks = pairs;
  }

  return (
    <div className={styles.section}>
      <div className={styles.colHeader}>
        <span>Total ({baseAsset})</span>
        <span>Size ({baseAsset})</span>
        <span className={styles.colHeaderRight}>Price (USD)</span>
      </div>
      <div className={`${styles.rows} ${styles.rowsAsk}`}>
        {displayAsks.map(([price, size, total]) => (
          <OrderBookRow
            key={price}
            price={price}
            size={size}
            total={total}
            precision={precision}
            side="ask"
          />
        ))}
      </div>
    </div>
  );
});

const EMPTY: readonly [number, number, number][] = [];
