import type { RawTickerMessage } from '@/shared/types';
import { createPrice } from '../valueObjects/Price';
import type { Ticker } from '../entities/Ticker';

export class TickerEngine {
  /**
   * Transform a raw ticker message into a typed Ticker entity.
   * Throws on malformed payload — callers catch and discard.
   */
  process(message: RawTickerMessage): Ticker {
    const { close, open } = message;

    if (!Number.isFinite(close) || close <= 0) {
      throw new RangeError(`[TickerEngine] invalid close for ${message.symbol}: ${close}`);
    }

    const change24h =
      Number.isFinite(open) && open !== 0 ? ((close - open) / open) * 100 : 0;

    return {
      symbol: message.symbol,
      lastPrice: createPrice(close),
      markPrice: safePrice(message.mark_price),
      indexPrice: safePrice(message.spot_price),
      bestBid: safePrice(message.quotes?.best_bid),
      bestAsk: safePrice(message.quotes?.best_ask),
      change24h: Number.isFinite(change24h) ? change24h : 0,
      volume24h: message.volume ?? 0,
      high24h: safePriceNum(message.high),
      low24h: safePriceNum(message.low),
      openInterest: parseFloatSafe(message.oi),
      fundingRate: parseFloatSafe(message.funding_rate),
      timestamp: message.timestamp,
    };
  }

}

function safePrice(raw: string | undefined | null): ReturnType<typeof createPrice> {
  const val = parseFloat(raw ?? '0');
  return createPrice(Number.isFinite(val) && val >= 0 ? val : 0);
}

function safePriceNum(raw: number | undefined): ReturnType<typeof createPrice> {
  const val = raw ?? 0;
  return createPrice(Number.isFinite(val) && val >= 0 ? val : 0);
}

function parseFloatSafe(raw: string | undefined | null): number {
  const val = parseFloat(raw ?? '0');
  return Number.isFinite(val) ? val : 0;
}
