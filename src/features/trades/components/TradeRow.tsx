import { memo } from 'react';
import type { Trade } from '@/domain/entities/Trade';
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

function formatPrice(price: number, precision: number): string {
  const fixed = price.toFixed(precision);
  const dotIdx = fixed.indexOf('.');
  const int = dotIdx === -1 ? fixed : fixed.slice(0, dotIdx);
  const dec = dotIdx === -1 ? undefined : fixed.slice(dotIdx + 1);
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec !== undefined ? `${withCommas}.${dec}` : withCommas;
}

function formatSize(size: number): string {
  return size.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}

function formatTime(timestampMs: number): string {
  const d = new Date(timestampMs);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  const ms = d.getMilliseconds().toString().padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}
