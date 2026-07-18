import { memo } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { useOrderBookViewStore } from '@/app/stores/orderBookViewStore';
import styles from '../orderBook.module.css';

interface Props {
  readonly symbol: TradingSymbol;
  readonly precision: number;
}

export const MidPriceBar = memo(function MidPriceBar({ symbol, precision }: Props) {
  const midPrice = useOrderBookViewStore(
    (s) => s.viewModels.get(symbol)?.spread?.midPrice ?? null,
  );

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
