/**
 * Trade entity — a single executed trade on the exchange.
 *
 * Immutable. The trade engine maintains an ordered collection of these.
 * 'buy' = aggressor was a buyer (price moved up). 'sell' = price moved down.
 */

import type { TradingSymbol } from '@/shared/types';
import type { Price } from '../valueObjects/Price';

export type TradeSide = 'buy' | 'sell';

export interface Trade {
  readonly id: string;
  readonly symbol: TradingSymbol;
  readonly price: Price;
  readonly size: number;
  readonly side: TradeSide;
  readonly timestamp: number;
}
