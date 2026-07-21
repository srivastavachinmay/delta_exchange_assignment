import type { RawTradeMessage, TradingSymbol } from '@/shared/types';
import type { Trade, TradeStats, TradeSnapshot } from '../entities/Trade';
import { createPrice } from '../valueObjects/Price';

export const MAX_TRADES = 100;
const AGGREGATION_WINDOW_MS = 100;

export class TradeEngine {
  private readonly state = new Map<TradingSymbol, Trade[]>();

  apply(message: RawTradeMessage): void {
    const price = parseFloat(String(message.price).replace(/,/g, ''));
    if (!Number.isFinite(price) || price <= 0) return;
    if (!Number.isFinite(message.size) || message.size <= 0) return;

    const timestampMs = Math.floor(message.timestamp / 1000);
    const side: Trade['side'] = message.buyer_role === 'taker' ? 'buy' : 'sell';

    // newest-first — snapshot() produces an immutable copy so callers never observe internal mutations
    const trades = this.state.get(message.symbol);

    // Merge into head if same price, same side, within aggregation window.
    if (trades && trades.length > 0) {
      const head = trades[0]!;
      if (
        head.price === price &&
        head.side === side &&
        timestampMs - head.timestamp <= AGGREGATION_WINDOW_MS
      ) {
        trades[0] = { ...head, size: head.size + message.size, count: head.count + 1 };
        return;
      }
    }

    const trade: Trade = {
      id: `${message.symbol}-${message.timestamp}`,
      symbol: message.symbol,
      price: createPrice(price),
      size: message.size,
      count: 1,
      side,
      timestamp: timestampMs,
    };

    if (!trades) {
      this.state.set(message.symbol, [trade]);
      return;
    }
    if (trades.length >= MAX_TRADES) {
      trades.length = MAX_TRADES - 1; // drop oldest (last element, newest-first order)
    }
    trades.unshift(trade);
  }

  snapshot(symbol: TradingSymbol, nowMs: number): TradeSnapshot | null {
    const trades = this.state.get(symbol);
    if (!trades) return null;

    const snapshot = trades.slice(); // immutable copy — callers must not observe internal mutations
    return {
      symbol,
      trades: snapshot,
      stats: computeStats(snapshot, nowMs),
    };
  }

  clear(symbol: TradingSymbol): void {
    this.state.delete(symbol);
  }
}

function computeStats(trades: readonly Trade[], nowMs: number): TradeStats {
  const cutoffMs = nowMs - 60_000;
  let volume1mBuy = 0;
  let volume1mSell = 0;
  let count1m = 0;

  for (const t of trades) {
    if (t.timestamp < cutoffMs) break; // trades are newest-first; once past cutoff, done
    count1m += t.count;
    if (t.side === 'buy') {
      volume1mBuy += t.size;
    } else {
      volume1mSell += t.size;
    }
  }

  const totalSize = volume1mBuy + volume1mSell;
  return {
    volume1mBuy,
    volume1mSell,
    count1m,
    avgSize1m: count1m > 0 ? totalSize / count1m : 0,
  };
}
