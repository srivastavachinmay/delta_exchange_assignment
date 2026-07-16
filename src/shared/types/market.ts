/**
 * Shared market configuration types.
 * Config data (not domain entities) used across infrastructure and features.
 */

import type { Channel, TradingSymbol } from './websocket';

export type { Channel, TradingSymbol };

/** Static per-symbol display and precision configuration. Data-driven. */
export interface SymbolConfig {
  readonly symbol: TradingSymbol;
  readonly displayName: string;
  /** Decimal places shown in the UI. */
  readonly displayPrecision: number;
  /** Internal precision for calculations. */
  readonly pricePrecision: number;
  readonly quantityPrecision: number;
  /** Valid grouping step values for the order book price ladder. */
  readonly allowedGroupings: readonly number[];
  readonly defaultGrouping: number;
}

/** Server-acknowledged subscription. Pending subs live only in WebSocketManager. */
export interface Subscription {
  readonly symbol: TradingSymbol;
  readonly channel: Channel;
  readonly acknowledgedAt: number;
}

export type SubscriptionKey = `${TradingSymbol}:${Channel}`;

export function makeSubscriptionKey(
  symbol: TradingSymbol,
  channel: Channel,
): SubscriptionKey {
  return `${symbol}:${channel}`;
}
