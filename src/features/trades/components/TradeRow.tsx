import { memo, useLayoutEffect, useRef } from 'react';
import type { Trade } from '@/domain/entities/Trade';
import { formatPrice, formatSize, formatTime } from '../tradeFormatters';
import styles from '../trades.module.css';

interface Props {
  readonly trade: Trade;
  readonly precision: number;
  readonly largeTradeValue: number;
}

function handleAnimationEnd(e: React.AnimationEvent<HTMLDivElement>): void {
  e.currentTarget.classList.remove(styles.rowFlash ?? '');
}

export const TradeRow = memo(function TradeRow({ trade, precision, largeTradeValue }: Props) {
  const isLarge = trade.price * trade.size >= largeTradeValue;
  const priceStr = formatPrice(trade.price, precision);
  const sizeStr = formatSize(trade.size);
  const timeStr = formatTime(trade.timestamp);

  const rowRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Capture element at mount time — rowRef.current is null by cleanup.
    const el = rowRef.current;
    return () => {
      // Cancel animations before unmount so Chrome's animation timeline releases
      // its reference. onAnimationEnd handles the ≥0.5s case; this handles early unmount.
      el?.getAnimations().forEach((a) => a.cancel());
    };
  }, []);

  const sideClass = trade.side === 'buy' ? styles.rowBuy : styles.rowSell;
  const rowClass = isLarge
    ? `${styles.row} ${styles.rowFlash} ${sideClass} ${styles.rowLarge}`
    : `${styles.row} ${styles.rowFlash} ${sideClass}`;

  return (
    <div ref={rowRef} className={rowClass} onAnimationEnd={handleAnimationEnd}>
      <span className={styles.time}>{timeStr}</span>
      <span className={trade.side === 'buy' ? styles.buyPrice : styles.sellPrice}>{priceStr}</span>
      <span className={styles.size}>{sizeStr}</span>
    </div>
  );
});
