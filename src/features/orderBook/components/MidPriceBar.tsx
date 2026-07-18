import { memo } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { useOrderBookStore } from '@/app/stores/orderBookStore';
import styles from '../orderBook.module.css';

interface Props {
  readonly symbol: TradingSymbol;
  readonly precision: number;
}

export const MidPriceBar = memo(function MidPriceBar({ symbol, precision }: Props) {
  const midPrice = useOrderBookStore((s) => {
    const book = s.books.get(symbol);
    if (!book || book.bids.length === 0 || book.asks.length === 0) return null;
    return (book.bids[0]![0] + book.asks[0]![0]) / 2;
  });

  return (
    <div className={styles.midBar}>
      <div>
        <div className={styles.midLabel}>Mid Price</div>
        <div className={styles.midPrice}>
          {midPrice != null ? formatPrice(midPrice, precision) : '—'}
        </div>
      </div>
    </div>
  );
});

function formatPrice(price: number, precision: number): string {
  const fixed = price.toFixed(precision);
  const dotIdx = fixed.indexOf('.');
  const int = dotIdx === -1 ? fixed : fixed.slice(0, dotIdx);
  const dec = dotIdx === -1 ? undefined : fixed.slice(dotIdx + 1);
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec !== undefined ? `${withCommas}.${dec}` : withCommas;
}
