import { memo } from 'react';
import type { Trade } from '@/domain/entities/Trade';
import { formatPrice, formatSize, formatTime } from '../tradeFormatters';
import styles from '../trades.module.css';

interface Props {
  readonly trade: Trade;
  readonly precision: number;
  readonly largeTradeValue: number;
}

export const TradeRow = memo(function TradeRow({ trade, precision, largeTradeValue }: Props) {
  const isLarge = trade.price * trade.size >= largeTradeValue;
  const priceStr = formatPrice(trade.price, precision);
  const sizeStr = formatSize(trade.size);
  const timeStr = formatTime(trade.timestamp);

  const rowClass = [
    styles.row,
    styles.rowFlash,
    trade.side === 'buy' ? styles.rowBuy : styles.rowSell,
    isLarge ? styles.rowLarge : '',
  ].join(' ');

  return (
    <div className={rowClass}>
      <span className={styles.time}>{timeStr}</span>
      <span className={trade.side === 'buy' ? styles.buyPrice : styles.sellPrice}>{priceStr}</span>
      <span className={styles.size}>{sizeStr}</span>
    </div>
  );
});
