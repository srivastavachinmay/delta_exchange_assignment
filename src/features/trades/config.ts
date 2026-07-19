import type { TradingSymbol } from '@/shared/types';

export const LARGE_TRADE_THRESHOLDS: Record<TradingSymbol, number> = {
  BTCUSD: 50_000,
  ETHUSD: 10_000,
  XRPUSD: 5_000,
  SOLUSD: 5_000,
  PAXGUSD: 10_000,
  DOGEUSD: 5_000,
};
