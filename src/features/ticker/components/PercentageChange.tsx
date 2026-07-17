import { memo } from 'react';
import styles from './ticker-components.module.css';

interface Props {
  readonly change: number;
}

export const PercentageChange = memo(function PercentageChange({ change }: Props) {
  const sign = change >= 0 ? '+' : '';
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
  return (
    <span className={styles.change} data-direction={direction}>
      {sign}{change.toFixed(2)}%
    </span>
  );
});
