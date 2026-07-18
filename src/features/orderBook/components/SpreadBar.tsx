import { memo } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { useOrderBookViewStore } from '@/app/stores/orderBookViewStore';
import styles from '../orderBook.module.css';

interface Props {
  readonly symbol: TradingSymbol;
  readonly precision: number;
}

export const SpreadBar = memo(function SpreadBar({ symbol, precision }: Props) {
  const spread = useOrderBookViewStore((s) => s.viewModels.get(symbol)?.spread ?? null);

  if (!spread) {
    return (
      <div className={styles.spreadBar}>
        <span className={styles.spreadEmpty}>—</span>
      </div>
    );
  }

  return (
    <div className={styles.spreadBar}>
      <SpreadCell label="Bid" value={formatPrice(spread.bestBid, precision)} cls={styles.spreadBid} />
      <SpreadCell label="Spread" value={formatPrice(spread.absolute, precision)} cls={styles.spreadNeutral} />
      <SpreadCell label="%" value={`${spread.percent.toFixed(3)}%`} cls={styles.spreadNeutral} />
      <SpreadCell label="Ask" value={formatPrice(spread.bestAsk, precision)} cls={styles.spreadAsk} />
      <SpreadCell label="Mid" value={formatPrice(spread.midPrice, precision)} cls={styles.spreadMid} />
    </div>
  );
});

function SpreadCell({ label, value, cls }: { label: string; value: string; cls: string | undefined }) {
  return (
    <div className={styles.spreadCell}>
      <span className={styles.spreadLabel}>{label}</span>
      <span className={`${styles.spreadValue} ${cls}`}>{value}</span>
    </div>
  );
}

function formatPrice(price: number, precision: number): string {
  const fixed = price.toFixed(precision);
  const dotIdx = fixed.indexOf('.');
  const int = dotIdx === -1 ? fixed : fixed.slice(0, dotIdx);
  const dec = dotIdx === -1 ? undefined : fixed.slice(dotIdx + 1);
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec !== undefined ? `${withCommas}.${dec}` : withCommas;
}
