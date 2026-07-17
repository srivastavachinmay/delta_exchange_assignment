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

/** One entry in the channels array of a subscribe/unsubscribe payload. */
export interface ChannelEntry {
  readonly name: string;
  readonly symbols: readonly TradingSymbol[];
}

export interface SubscribeMessage {
  readonly type: 'subscribe';
  readonly payload: {
    readonly channels: readonly ChannelEntry[];
  };
}

export interface UnsubscribeMessage {
  readonly type: 'unsubscribe';
  readonly payload: {
    readonly channels: readonly ChannelEntry[];
  };
}

export type OutboundMessage = SubscribeMessage | UnsubscribeMessage;

// ---------------------------------------------------------------------------
// Inbound messages (server → client)
// ---------------------------------------------------------------------------

export interface BaseInboundMessage {
  readonly type: string;
  /** Present on most messages; v2/ticker uses `type` as the discriminator instead. */
  readonly channel?: Channel;
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
 * Delta Exchange v2/ticker wire format — all fields at top level, no `payload` wrapper.
 * `close` and `open` arrive as numbers; price strings (`mark_price`, etc.) are strings.
 */
export interface RawTickerMessage extends BaseInboundMessage {
  readonly type: 'v2/ticker';
  readonly symbol: TradingSymbol;
  /** Last traded price — JavaScript number. */
  readonly close: number;
  /** 24-hour open price — JavaScript number. */
  readonly open: number;
  readonly high?: number;
  readonly low?: number;
  readonly volume?: number;
  readonly mark_price?: string;
  readonly spot_price?: string;
  readonly oi?: string;
  readonly funding_rate?: string;
  readonly quotes?: {
    readonly best_ask: string;
    readonly best_bid: string;
    readonly bid_size?: string;
    readonly ask_size?: string;
  } | null;
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
