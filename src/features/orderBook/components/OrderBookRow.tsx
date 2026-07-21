import { memo, useLayoutEffect, useRef } from 'react';
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

const sizeFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const FLASH_THRESHOLD = 0.10;

function handleFlashEnd(e: React.AnimationEvent<HTMLDivElement>): void {
  e.currentTarget.classList.remove(styles.rowFlashUp ?? '', styles.rowFlashDown ?? '');
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
  const sizeStr = sizeFormatter.format(size);
  const totalStr = sizeFormatter.format(total);
  const depthStyle = { '--depth': depthPercent } as React.CSSProperties;

  const rowRef = useRef<HTMLDivElement>(null);
  const prevSizeRef = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    const prevSize = prevSizeRef.current;

    if (prevSize !== undefined && prevSize > 0 && prevSize !== size) {
      const changePct = Math.abs(size - prevSize) / prevSize;
      if (changePct > FLASH_THRESHOLD) {
        const el = rowRef.current;
        if (el) {
          const flashClass = size > prevSize
            ? (styles.rowFlashUp ?? '')
            : (styles.rowFlashDown ?? '');
          el.classList.remove(styles.rowFlashUp ?? '', styles.rowFlashDown ?? '');
          void el.offsetHeight;
          el.classList.add(flashClass);
        }
      }
    }

    prevSizeRef.current = size;
  }, [size]);

  if (side === 'ask') {
    return (
      <div ref={rowRef} className={styles.row} style={depthStyle} onAnimationEnd={handleFlashEnd}>
        <div className={`${styles.depthBar} ${styles.depthBarAsk}`} />
        <span className={styles.total}>{totalStr}</span>
        <span className={styles.size}>{sizeStr}</span>
        <span className={styles.askPrice}>{priceStr}</span>
      </div>
    );
  }

  return (
    <div ref={rowRef} className={styles.row} style={depthStyle} onAnimationEnd={handleFlashEnd}>
      <div className={`${styles.depthBar} ${styles.depthBarBid}`} />
      <span className={styles.bidPrice}>{priceStr}</span>
      <span className={styles.size}>{sizeStr}</span>
      <span className={`${styles.total} ${styles.sizeRight}`}>{totalStr}</span>
    </div>
  );
});
