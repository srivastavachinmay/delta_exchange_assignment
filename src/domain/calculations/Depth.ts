import type { PriceLevel } from '../entities/OrderBook';

export interface DepthLevel {
  readonly price: number;
  readonly size: number;
  readonly cumulativeSize: number;
  /** 0–1, proportion of total side liquidity at this level. */
  readonly depthPercent: number;
}

export function computeCumulativeDepth(
  levels: readonly PriceLevel[],
): readonly DepthLevel[] {
  if (levels.length === 0) return EMPTY;

  let cumulative = 0;
  const withCumulative: DepthLevel[] = levels.map(([price, size]) => {
    cumulative += size;
    return { price, size, cumulativeSize: cumulative, depthPercent: 0 };
  });

  const maxCumulative = cumulative;
  if (maxCumulative === 0) return withCumulative;

  return withCumulative.map((level) => ({
    ...level,
    depthPercent: level.cumulativeSize / maxCumulative,
  }));
}

const EMPTY: readonly DepthLevel[] = [];
