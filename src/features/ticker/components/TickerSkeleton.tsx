import { memo } from 'react';
import styles from './ticker-components.module.css';

export const TickerSkeleton = memo(function TickerSkeleton() {
  return (
    <>
      <span className={`${styles.skeleton} ${styles.priceSkeleton}`} aria-hidden="true" />
      <span className={`${styles.skeleton} ${styles.changeSkeleton}`} aria-hidden="true" />
    </>
  );
});
