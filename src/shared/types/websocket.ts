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
 * Raw order book message — top-level bids/asks as [price, size] string tuples.
 * No payload wrapper, no sequence number in the observed wire format.
 * First message after subscription is a full snapshot; subsequent are deltas.
 * A size of "0" signals level removal.
 */
export interface RawOrderBookMessage extends BaseInboundMessage {
  readonly type: 'l2_orderbook';
  readonly symbol: TradingSymbol;
  readonly bids: readonly [string, string][];
  readonly asks: readonly [string, string][];
}

/**
 * Raw trade message — single execution from the 'all_trades' channel.
 * timestamp is in microseconds (divide by 1000 for ms).
 * side is derived: buyer_role === 'taker' → 'buy', else 'sell'.
 */
export interface RawTradeMessage extends BaseInboundMessage {
  readonly type: 'all_trades';
  readonly buyer_role: 'maker' | 'taker';
  readonly price: string;
  readonly product_id: number;
  readonly seller_role: 'maker' | 'taker';
  readonly size: number;
  readonly symbol: TradingSymbol;
  readonly timestamp: number;
}

export type InboundMessage =
  | SubscriptionAckMessage
  | UnsubscriptionAckMessage
  | ErrorMessage
  | RawTickerMessage
  | RawOrderBookMessage
  | RawTradeMessage;
