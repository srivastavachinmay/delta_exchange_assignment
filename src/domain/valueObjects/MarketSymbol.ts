/**
 * MarketSymbol — branded string type for trading symbols.
 *
 * Named MarketSymbol (not Symbol) to avoid clashing with JS built-in Symbol.
 * Prevents passing arbitrary strings where a validated symbol is expected.
 *
 * In practice, TradingSymbol from shared/types covers most use cases.
 * This value object is for domain services that need to validate or
 * construct symbol strings from raw data.
 */

import type { TradingSymbol } from '@/shared/types';
import { SUPPORTED_SYMBOLS } from '@/shared/constants/symbols';

declare const __symbolBrand: unique symbol;

export type MarketSymbol = TradingSymbol & { readonly [__symbolBrand]: 'MarketSymbol' };

export function createMarketSymbol(raw: string): MarketSymbol {
  if (!(SUPPORTED_SYMBOLS as readonly string[]).includes(raw)) {
    throw new Error(`Unsupported symbol: ${raw}`);
  }
  return raw as MarketSymbol;
}

export function isMarketSymbol(raw: string): raw is MarketSymbol {
  return (SUPPORTED_SYMBOLS as readonly string[]).includes(raw);
}
