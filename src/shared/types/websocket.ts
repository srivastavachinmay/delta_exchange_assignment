/**
 * Wire protocol types — exactly what Delta Exchange sends over WebSocket.
 *
 * These are DTOs, not domain objects. The infrastructure adapter translates
 * these into domain-typed structures before handing to domain engines.
 *
 * Rule: never import from domain/, application/, or infrastructure/ here.
 * Shared is the innermost circle — zero dependencies upward.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Canonical trading symbol identifiers as used in the API. */
export type TradingSymbol =
  | 'BTCUSD'
  | 'ETHUSD'
  | 'XRPUSD'
  | 'SOLUSD'
  | 'PAXGUSD'
  | 'DOGEUSD';

/** WebSocket channel names. String union over enum — survives JSON round-trip. */
export type Channel =
  | 'ticker'
  | 'orderbook'
  | 'trades'
  | 'subscription'
  | 'connection';

// ---------------------------------------------------------------------------
// Outbound messages (client → server)
// ---------------------------------------------------------------------------

export interface SubscribeMessage {
  readonly type: 'subscribe';
  readonly payload: {
    readonly channels: Channel[];
    readonly symbols: TradingSymbol[];
  };
}

export interface UnsubscribeMessage {
  readonly type: 'unsubscribe';
  readonly payload: {
    readonly channels: Channel[];
    readonly symbols: TradingSymbol[];
  };
}

export type OutboundMessage = SubscribeMessage | UnsubscribeMessage;

// ---------------------------------------------------------------------------
// Inbound messages (server → client)
// ---------------------------------------------------------------------------

export interface BaseInboundMessage {
  readonly type: string;
  readonly channel: Channel;
  readonly timestamp: number;
}

export interface SubscriptionAckMessage extends BaseInboundMessage {
  readonly type: 'subscribed';
  readonly channel: 'subscription';
  readonly payload: {
    readonly channels: Channel[];
    readonly symbols: TradingSymbol[];
  };
}

export interface UnsubscriptionAckMessage extends BaseInboundMessage {
  readonly type: 'unsubscribed';
  readonly channel: 'subscription';
  readonly payload: {
    readonly channels: Channel[];
    readonly symbols: TradingSymbol[];
  };
}

export interface ErrorMessage extends BaseInboundMessage {
  readonly type: 'error';
  readonly payload: {
    readonly code: number;
    readonly message: string;
  };
}

/**
 * Raw ticker data as received from the server.
 * Fields will be typed precisely in Phase 2.
 */
export interface RawTickerMessage extends BaseInboundMessage {
  readonly type: 'ticker';
  readonly channel: 'ticker';
  readonly symbol: TradingSymbol;
  readonly payload: Record<string, unknown>;
}

/**
 * Raw order book message — could be snapshot or delta.
 * Discriminated by payload.type in Phase 3.
 */
export interface RawOrderBookMessage extends BaseInboundMessage {
  readonly type: 'orderbook';
  readonly channel: 'orderbook';
  readonly symbol: TradingSymbol;
  readonly payload: Record<string, unknown>;
}

/**
 * Raw trades message — array of recent executions.
 * Typed precisely in Phase 4.
 */
export interface RawTradesMessage extends BaseInboundMessage {
  readonly type: 'trades';
  readonly channel: 'trades';
  readonly symbol: TradingSymbol;
  readonly payload: Record<string, unknown>;
}

export type InboundMessage =
  | SubscriptionAckMessage
  | UnsubscriptionAckMessage
  | ErrorMessage
  | RawTickerMessage
  | RawOrderBookMessage
  | RawTradesMessage;
