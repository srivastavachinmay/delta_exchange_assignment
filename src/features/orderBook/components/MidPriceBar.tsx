import { memo } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { useOrderBookViewStore } from '@/app/stores/orderBookViewStore';
import { formatOrderBookPrice } from '../orderBookFormatters';
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
          {midPrice != null ? formatOrderBookPrice(midPrice, precision) : '—'}
        </div>
      </div>
    </div>
  );
});
