import type { PriceLevel } from '../entities/OrderBook';

export interface GroupingOptions {
  readonly step: number;
  readonly maxDepth: number;
}

// Input must be sorted: bids descending, asks ascending (guaranteed by OrderBookEngine).
// Same-group entries are contiguous — one O(n) pass suffices, no Map or secondary sort.
export function groupLevels(
  levels: readonly PriceLevel[],
  options: GroupingOptions,
  side: 'bid' | 'ask',
): readonly PriceLevel[] {
  const { step, maxDepth } = options;
  if (levels.length === 0) return EMPTY;

  const result: PriceLevel[] = [];
  const groupFn = side === 'bid' ? groupDown : groupUp;

  let currentKey = groupFn(levels[0]![0], step);
  let currentSize = 0;

  for (const [price, size] of levels) {
    const key = groupFn(price, step);
    if (key === currentKey) {
      currentSize += size;
    } else {
      result.push([currentKey, currentSize]);
      if (result.length === maxDepth) return result;
      currentKey = key;
      currentSize = size;
    }
  }

  if (result.length < maxDepth) {
    result.push([currentKey, currentSize]);
  }

  return result;
}

const EMPTY: readonly PriceLevel[] = [];

export function groupDown(price: number, step: number): number {
  return snapPrecision(Math.floor(price / step) * step, step);
}

export function groupUp(price: number, step: number): number {
  return snapPrecision(Math.ceil(price / step) * step, step);
}

function snapPrecision(value: number, step: number): number {
  const s = step.toString();
  const eIdx = s.indexOf('e-');
  if (eIdx !== -1) {
    const exp = parseInt(s.slice(eIdx + 2));
    return parseFloat(value.toFixed(exp));
  }
  const dotIdx = s.indexOf('.');
  const decimals = dotIdx === -1 ? 0 : s.length - dotIdx - 1;
  return parseFloat(value.toFixed(decimals));
}

