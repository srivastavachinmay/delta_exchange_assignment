import { memo } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { useFocusedSymbolStore } from '@/app/stores/focusedSymbolStore';
import styles from './ticker-components.module.css';

interface Props {
  readonly symbol: TradingSymbol;
}

export const FocusedSymbolIndicator = memo(function FocusedSymbolIndicator({ symbol }: Props) {
  const isFocused = useFocusedSymbolStore((s) => s.focusedSymbol === symbol);
  if (!isFocused) return null;
  return <span className={styles.focusIndicator} aria-hidden="true" />;
});
