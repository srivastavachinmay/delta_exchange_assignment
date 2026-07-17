import { memo } from 'react';
import { SUPPORTED_SYMBOLS } from '@/shared/constants/symbols';
import { TickerCard } from './TickerCard';
import { useTickerSubscription } from '@/features/ticker/hooks/useTickerSubscription';
import styles from './ticker-components.module.css';

export const TickerBar = memo(function TickerBar() {
  useTickerSubscription();
  return (
    <div className={styles.bar} role="list" aria-label="Market ticker">
      {SUPPORTED_SYMBOLS.map((symbol) => (
        <TickerCard key={symbol} symbol={symbol} />
      ))}
    </div>
  );
});
