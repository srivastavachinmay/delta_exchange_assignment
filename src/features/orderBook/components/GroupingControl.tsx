import { memo } from 'react';
import type { TradingSymbol } from '@/shared/types';
import { getSymbolConfig } from '@/shared/constants/symbols';
import { useGroupingStore } from '@/app/stores/groupingStore';
import styles from '../orderBook.module.css';

interface Props {
  readonly symbol: TradingSymbol;
}

export const GroupingControl = memo(function GroupingControl({ symbol }: Props) {
  const config = getSymbolConfig(symbol);
  const step = useGroupingStore((s) => s.steps.get(symbol) ?? config.defaultGrouping);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    useGroupingStore.getState().setStep(symbol, parseFloat(e.target.value));
  }

  return (
    <div className={styles.groupingControl}>
      <span className={styles.groupingLabel}>Group</span>
      <select className={styles.groupingSelect} value={step} onChange={handleChange}>
        {config.allowedGroupings.map((g) => (
          <option key={g} value={g}>
            {g.toString()}
          </option>
        ))}
      </select>
    </div>
  );
});
