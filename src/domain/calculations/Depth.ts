import type { PriceLevel } from '../entities/OrderBook';

export interface DepthLevel {
  readonly price: number;
  readonly size: number;
  readonly cumulativeSize: number;
  /** 0–1, proportion of total side liquidity at this level. */
  readonly depthPercent: number;
}

interface MutableDepthLevel {
  price: number;
  size: number;
  cumulativeSize: number;
  depthPercent: number;
}

export function computeCumulativeDepth(
  levels: readonly PriceLevel[],
): readonly DepthLevel[] {
  if (levels.length === 0) return EMPTY;

  let cumulative = 0;
  const result: MutableDepthLevel[] = new Array(levels.length);

  for (let i = 0; i < levels.length; i++) {
    const [price, size] = levels[i]!;
    cumulative += size;
    result[i] = { price, size, cumulativeSize: cumulative, depthPercent: 0 };
  }

  if (cumulative > 0) {
    for (let i = 0; i < result.length; i++) {
      result[i]!.depthPercent = result[i]!.cumulativeSize / cumulative;
    }
  }

  return result;
}

const EMPTY: readonly DepthLevel[] = [];
