import { memo } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { useOrderBookViewStore } from '@/app/stores/orderBookViewStore';
import { formatOrderBookPrice } from '../orderBookFormatters';
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
      <SpreadCell label="Bid" value={formatOrderBookPrice(spread.bestBid, precision)} cls={styles.spreadBid} />
      <SpreadCell label="Spread" value={formatOrderBookPrice(spread.absolute, precision)} cls={styles.spreadNeutral} />
      <SpreadCell label="%" value={`${spread.percent.toFixed(3)}%`} cls={styles.spreadNeutral} />
      <SpreadCell label="Ask" value={formatOrderBookPrice(spread.bestAsk, precision)} cls={styles.spreadAsk} />
      <SpreadCell label="Mid" value={formatOrderBookPrice(spread.midPrice, precision)} cls={styles.spreadMid} />
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
