import { memo } from 'react';
import styles from '../trades.module.css';

interface Props {
  readonly isVisible: boolean;
  readonly onJumpToLatest: () => void;
}

export const TradeFooter = memo(function TradeFooter({ isVisible, onJumpToLatest }: Props) {
  if (!isVisible) return null;
  return (
    <button className={styles.footer} onClick={onJumpToLatest} type="button">
      ↓ Jump to latest
    </button>
  );
});
