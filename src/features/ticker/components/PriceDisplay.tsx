import { memo } from 'react';
import type { Price } from '@/domain/valueObjects/Price';
import styles from './ticker-components.module.css';

interface Props {
  readonly price: Price;
  readonly precision: number;
}

export const PriceDisplay = memo(function PriceDisplay({ price, precision }: Props) {
  const formatted = (price as number).toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
  return <span className={styles.price}>{formatted}</span>;
});
