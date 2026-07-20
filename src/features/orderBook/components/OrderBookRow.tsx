import { memo } from 'react';
import { formatOrderBookPrice } from '../orderBookFormatters';
import styles from '../orderBook.module.css';

interface Props {
  readonly price: number;
  readonly size: number;
  readonly total: number;
  readonly depthPercent: number;
  readonly precision: number;
  readonly side: 'bid' | 'ask';
}

export const OrderBookRow = memo(function OrderBookRow({
  price,
  size,
  total,
  depthPercent,
  precision,
  side,
}: Props) {
  const priceStr = formatOrderBookPrice(price, precision);
  const sizeStr = formatSize(size);
  const totalStr = formatSize(total);

  // --depth drives the depth bar width via CSS; avoids a string allocation per render.
  const depthStyle = { '--depth': depthPercent } as React.CSSProperties;

  if (side === 'ask') {
    return (
      <div className={styles.row} style={depthStyle}>
        <div className={`${styles.depthBar} ${styles.depthBarAsk}`} />
        <span className={styles.total}>{totalStr}</span>
        <span className={styles.size}>{sizeStr}</span>
        <span className={styles.askPrice}>{priceStr}</span>
      </div>
    );
  }

  return (
    <div className={styles.row} style={depthStyle}>
      <div className={`${styles.depthBar} ${styles.depthBarBid}`} />
      <span className={styles.bidPrice}>{priceStr}</span>
      <span className={styles.size}>{sizeStr}</span>
      <span className={`${styles.total} ${styles.sizeRight}`}>{totalStr}</span>
    </div>
  );
});

function formatSize(size: number): string {
  return size.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}
