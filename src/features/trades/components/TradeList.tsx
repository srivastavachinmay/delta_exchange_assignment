import { memo, useRef, useEffect } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { useTradeStore } from '@/app/stores/tradeStore';
import { TradeRow } from './TradeRow';
import styles from '../trades.module.css';

interface Props {
  readonly symbol: TradingSymbol;
  readonly precision: number;
  readonly largeTradeValue: number;
}

const EMPTY: readonly never[] = [];
const AT_BOTTOM_THRESHOLD_PX = 40;

export const TradeList = memo(function TradeList({ symbol, precision, largeTradeValue }: Props) {
  const trades = useTradeStore((s) => s.snapshots.get(symbol)?.trades ?? EMPTY);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPaused = useRef(false);
  const isUserGesture = useRef(false);

  // trades is newest-first from the engine; display oldest-first for scroll-to-bottom UX.
  const displayTrades = trades.slice().reverse();

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

  const handleScroll = () => {
    if (!isUserGesture.current) return; // ignore programmatic scrolls

    const el = scrollRef.current;
    if (!el) return;

    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= AT_BOTTOM_THRESHOLD_PX;

    if (atBottom) {
      isPaused.current = false;
    } else {
      isPaused.current = true;
    }
  };

  return (
    <div ref={scrollRef} className={styles.list} onScroll={handleScroll}>
      {displayTrades.map((trade) => (
        <TradeRow
          key={trade.id}
          trade={trade}
          precision={precision}
          largeTradeValue={largeTradeValue}
        />
      ))}
    </div>
  );
});
