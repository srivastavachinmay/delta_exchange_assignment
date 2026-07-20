import { memo, useRef, useEffect, useImperativeHandle, useCallback } from 'react';
import type { Ref } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { useTradeStore } from '@/app/stores/tradeStore';
import { TradeRow } from './TradeRow';
import styles from '../trades.module.css';

export interface TradeListHandle {
  scrollToLatest(): void;
}

interface Props {
  readonly symbol: TradingSymbol;
  readonly precision: number;
  readonly largeTradeValue: number;
  readonly onPausedChange?: (paused: boolean) => void;
  readonly ref?: Ref<TradeListHandle>;
}

const EMPTY: readonly never[] = [];
const AT_BOTTOM_THRESHOLD_PX = 40;

export const TradeList = memo(function TradeList({ symbol, precision, largeTradeValue, onPausedChange, ref }: Props) {
  const trades = useTradeStore((s) => s.snapshots.get(symbol)?.trades ?? EMPTY);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPaused = useRef(false);
  const isUserGesture = useRef(false);

  // trades is newest-first from the engine; display oldest-first for scroll-to-bottom UX.
  const displayTrades = trades.slice().reverse();

  useImperativeHandle(ref, () => ({
    scrollToLatest() {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      if (isPaused.current) {
        isPaused.current = false;
        onPausedChange?.(false);
      }
    },
  }));

  // Reset pause state and footer visibility on symbol switch.
  useEffect(() => {
    isPaused.current = false;
    onPausedChange?.(false);
  }, [symbol, onPausedChange]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isPaused.current) return;
    el.scrollTop = el.scrollHeight;
  }, [displayTrades]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onGestureStart = () => { isUserGesture.current = true; };
    const onGestureEnd = () => { isUserGesture.current = false; };

    el.addEventListener('pointerdown', onGestureStart);
    el.addEventListener('pointerup', onGestureEnd);
    el.addEventListener('wheel', onGestureStart, { passive: true });

    return () => {
      el.removeEventListener('pointerdown', onGestureStart);
      el.removeEventListener('pointerup', onGestureEnd);
      el.removeEventListener('wheel', onGestureStart);
    };
  }, []);

  const handleScroll = useCallback(() => {
    if (!isUserGesture.current) return;
    const el = scrollRef.current;
    if (!el) return;

    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= AT_BOTTOM_THRESHOLD_PX;

    if (atBottom && isPaused.current) {
      isPaused.current = false;
      onPausedChange?.(false);
    } else if (!atBottom && !isPaused.current) {
      isPaused.current = true;
      onPausedChange?.(true);
    }
  }, [onPausedChange]);

  return (
    <div ref={scrollRef} className={styles.list} onScroll={handleScroll}>
      {displayTrades.length === 0
        ? <div className={styles.emptyState}>Waiting for trades…</div>
        : displayTrades.map((trade) => (
          <TradeRow
            key={trade.id}
            trade={trade}
            precision={precision}
            largeTradeValue={largeTradeValue}
          />
        ))
      }
    </div>
  );
});
