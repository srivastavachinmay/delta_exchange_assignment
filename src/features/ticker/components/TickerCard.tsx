import { memo, useCallback } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { useTickerStore } from '@/app/stores/tickerStore';
import { useFocusedSymbolStore } from '@/app/stores/focusedSymbolStore';
import { getSymbolConfig } from '@/shared/constants/symbols';
import { PriceDisplay } from './PriceDisplay';
import { PercentageChange } from './PercentageChange';
import { FocusedSymbolIndicator } from './FocusedSymbolIndicator';
import { TickerSkeleton } from './TickerSkeleton';
import styles from './ticker-components.module.css';

interface Props {
  readonly symbol: TradingSymbol;
}

const TickerCardData = memo(function TickerCardData({
  symbol,
  precision,
}: {
  readonly symbol: TradingSymbol;
  readonly precision: number;
}) {
  const ticker = useTickerStore((s) => s.tickers.get(symbol));
  if (!ticker) return <TickerSkeleton />;
  return (
    <>
      <PriceDisplay price={ticker.lastPrice} precision={precision} />
      <PercentageChange change={ticker.change24h} />
    </>
  );
});

export const TickerCard = memo(function TickerCard({ symbol }: Props) {
  const isFocused = useFocusedSymbolStore((s) => s.focusedSymbol === symbol);
  const setFocusedSymbol = useFocusedSymbolStore((s) => s.setFocusedSymbol);
  const config = getSymbolConfig(symbol);

  const handleClick = useCallback(() => {
    setFocusedSymbol(symbol);
  }, [symbol, setFocusedSymbol]);

  return (
    <button
      className={styles.card}
      data-focused={isFocused}
      onClick={handleClick}
      aria-pressed={isFocused}
      aria-label={`${config.displayName} ticker`}
      role="listitem"
      type="button"
    >
      <FocusedSymbolIndicator symbol={symbol} />
      <span className={styles.symbol}>{config.displayName}</span>
      <TickerCardData symbol={symbol} precision={config.displayPrecision} />
    </button>
  );
});
