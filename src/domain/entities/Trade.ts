import type { TradingSymbol } from '@/shared/types';
import type { Price } from '../valueObjects/Price';

export type TradeSide = 'buy' | 'sell';

export interface Trade {
  readonly id: string;
  readonly symbol: TradingSymbol;
  readonly price: Price;
  readonly size: number;
  readonly side: TradeSide;
  readonly timestamp: number; // milliseconds
}

export interface TradeStats {
  readonly volume1mBuy: number;
  readonly volume1mSell: number;
  readonly count1m: number;
  readonly avgSize1m: number;
}

export interface TradeSnapshot {
  readonly symbol: TradingSymbol;
  readonly trades: readonly Trade[];
  readonly stats: TradeStats;
}
