import { memo } from 'react';
import styles from '../orderBook.module.css';

interface Props {
  readonly price: number;
  readonly size: number;
  readonly total: number;
  readonly precision: number;
  readonly side: 'bid' | 'ask';
}

export const OrderBookRow = memo(function OrderBookRow({ price, size, total, precision, side }: Props) {
  const priceStr = formatPrice(price, precision);
  const sizeStr = formatSize(size);
  const totalStr = formatSize(total);

  if (side === 'ask') {
    return (
      <div className={styles.row}>
        <span className={styles.total}>{totalStr}</span>
        <span className={styles.size}>{sizeStr}</span>
        <span className={styles.askPrice}>{priceStr}</span>
      </div>
    );
  }

  return (
    <div className={styles.row}>
      <span className={styles.bidPrice}>{priceStr}</span>
      <span className={styles.size}>{sizeStr}</span>
      <span className={`${styles.total} ${styles.sizeRight}`}>{totalStr}</span>
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

function formatSize(size: number): string {
  return size.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}
