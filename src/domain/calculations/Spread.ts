import type { OrderBook } from '../entities/OrderBook';

export interface SpreadResult {
  readonly bestBid: number;
  readonly bestAsk: number;
  readonly absolute: number;
  readonly percent: number;
  readonly midPrice: number;
}

export function computeSpread(book: OrderBook): SpreadResult | null {
  if (book.bids.length === 0 || book.asks.length === 0) return null;

  const bestBid = book.bids[0]![0];
  const bestAsk = book.asks[0]![0];
  const midPrice = (bestBid + bestAsk) / 2;
  const absolute = bestAsk - bestBid;
  const percent = midPrice > 0 ? (absolute / midPrice) * 100 : 0;

  return { bestBid, bestAsk, absolute, percent, midPrice };
}
