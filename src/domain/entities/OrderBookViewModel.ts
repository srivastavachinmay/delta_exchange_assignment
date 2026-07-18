import type { TradingSymbol } from '@/shared/types';
import type { OrderBook } from './OrderBook';
import type { DepthLevel } from '../calculations/Depth';
import type { SpreadResult } from '../calculations/Spread';
import { groupLevels } from '../calculations/Grouping';
import { computeCumulativeDepth } from '../calculations/Depth';
import { computeSpread } from '../calculations/Spread';

const MAX_DEPTH = 10;

export interface OrderBookViewModel {
  readonly symbol: TradingSymbol;
  readonly groupingStep: number;
  readonly bids: readonly DepthLevel[];
  readonly asks: readonly DepthLevel[];
  readonly spread: SpreadResult | null;
}

export function buildViewModel(book: OrderBook, step: number): OrderBookViewModel {
  const groupedBids = groupLevels(book.bids, { step, maxDepth: MAX_DEPTH }, 'bid');
  const groupedAsks = groupLevels(book.asks, { step, maxDepth: MAX_DEPTH }, 'ask');

  return {
    symbol: book.symbol,
    groupingStep: step,
    bids: computeCumulativeDepth(groupedBids),
    asks: computeCumulativeDepth(groupedAsks),
    spread: computeSpread(book),
  };
}
