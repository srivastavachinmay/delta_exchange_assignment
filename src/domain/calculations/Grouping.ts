import type { PriceLevel } from '../entities/OrderBook';

export interface GroupingOptions {
  readonly step: number;
  readonly maxDepth: number;
}

export function groupLevels(
  levels: readonly PriceLevel[],
  options: GroupingOptions,
  side: 'bid' | 'ask',
): readonly PriceLevel[] {
  const { step, maxDepth } = options;
  const accumulated = new Map<number, number>();

  for (const [price, size] of levels) {
    const key = side === 'bid' ? groupDown(price, step) : groupUp(price, step);
    accumulated.set(key, (accumulated.get(key) ?? 0) + size);
  }

  const result: PriceLevel[] = [];
  for (const [price, size] of accumulated) {
    result.push([price, size]);
  }

  result.sort(side === 'bid' ? descending : ascending);
  return result.slice(0, maxDepth);
}

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

function ascending(a: PriceLevel, b: PriceLevel): number {
  return a[0] - b[0];
}

function descending(a: PriceLevel, b: PriceLevel): number {
  return b[0] - a[0];
}
