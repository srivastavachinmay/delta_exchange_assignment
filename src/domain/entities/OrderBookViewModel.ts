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

  // Reverse asks in-place so they are stored in display order (highest price first,
  // best ask last adjacent to SpreadBar). The array is freshly allocated by
  // computeCumulativeDepth and not yet shared — in-place reverse is safe.
  const asksDisplay = (computeCumulativeDepth(groupedAsks) as DepthLevel[]).reverse();

  return {
    symbol: book.symbol,
    groupingStep: step,
    bids: computeCumulativeDepth(groupedBids),
    asks: asksDisplay,
    spread: computeSpread(book),
  };
}
