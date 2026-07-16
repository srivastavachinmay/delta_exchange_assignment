import type { SymbolConfig, TradingSymbol } from '@/shared/types';

/**
 * Symbol metadata — single source of truth.
 *
 * Components, engines, and formatters derive everything from here.
 * Nothing is hardcoded in render paths.
 *
 * Precision values are sourced from Delta Exchange API documentation.
 * Groupings represent valid price ladder steps for the order book UI.
 */
export const SYMBOL_CONFIG: Readonly<Record<TradingSymbol, SymbolConfig>> = {
  BTCUSD: {
    symbol: 'BTCUSD',
    displayName: 'BTC / USD',
    displayPrecision: 1,
    pricePrecision: 2,
    quantityPrecision: 6,
    allowedGroupings: [0.1, 0.5, 1, 2.5, 5, 10, 25, 50, 100],
    defaultGrouping: 1,
  },
  ETHUSD: {
    symbol: 'ETHUSD',
    displayName: 'ETH / USD',
    displayPrecision: 2,
    pricePrecision: 2,
    quantityPrecision: 5,
    allowedGroupings: [0.01, 0.05, 0.1, 0.5, 1, 2.5, 5, 10],
    defaultGrouping: 0.1,
  },
  XRPUSD: {
    symbol: 'XRPUSD',
    displayName: 'XRP / USD',
    displayPrecision: 4,
    pricePrecision: 5,
    quantityPrecision: 2,
    allowedGroupings: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1],
    defaultGrouping: 0.0001,
  },
  SOLUSD: {
    symbol: 'SOLUSD',
    displayName: 'SOL / USD',
    displayPrecision: 3,
    pricePrecision: 4,
    quantityPrecision: 3,
    allowedGroupings: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
    defaultGrouping: 0.01,
  },
  PAXGUSD: {
    symbol: 'PAXGUSD',
    displayName: 'PAXG / USD',
    displayPrecision: 2,
    pricePrecision: 2,
    quantityPrecision: 5,
    allowedGroupings: [0.01, 0.1, 0.5, 1, 5, 10, 25, 50],
    defaultGrouping: 1,
  },
  DOGEUSD: {
    symbol: 'DOGEUSD',
    displayName: 'DOGE / USD',
    displayPrecision: 5,
    pricePrecision: 6,
    quantityPrecision: 2,
    allowedGroupings: [0.00001, 0.0001, 0.0005, 0.001, 0.005, 0.01],
    defaultGrouping: 0.0001,
  },
} as const;

/** Ordered list of supported symbols — drives UI display sequence. */
export const SUPPORTED_SYMBOLS: readonly TradingSymbol[] = [
  'BTCUSD',
  'ETHUSD',
  'XRPUSD',
  'SOLUSD',
  'PAXGUSD',
  'DOGEUSD',
] as const;

export function getSymbolConfig(symbol: TradingSymbol): SymbolConfig {
  return SYMBOL_CONFIG[symbol];
}
