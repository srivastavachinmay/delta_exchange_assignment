import type { RawTradeMessage, TradingSymbol } from '@/shared/types';
import type { Trade, TradeStats, TradeSnapshot } from '../entities/Trade';
import { createPrice } from '../valueObjects/Price';

export const MAX_TRADES = 100;
const ONE_MINUTE_MS = 60_000;

export class TradeEngine {
  private readonly state = new Map<TradingSymbol, Trade[]>();

  apply(message: RawTradeMessage): void {
    const price = parseFloat(String(message.price).replace(/,/g, ''));
    if (!Number.isFinite(price) || price <= 0) return;
    if (!Number.isFinite(message.size) || message.size <= 0) return;

    const trade: Trade = {
      id: `${message.symbol}-${message.timestamp}`,
      symbol: message.symbol,
      price: createPrice(price),
      size: message.size,
      side: message.buyer_role === 'taker' ? 'buy' : 'sell',
      timestamp: Math.floor(message.timestamp / 1000),
    };

    const existing = this.state.get(message.symbol) ?? [];
    const updated = [trade, ...existing];
    this.state.set(message.symbol, updated.length > MAX_TRADES ? updated.slice(0, MAX_TRADES) : updated);
  }

  snapshot(symbol: TradingSymbol, nowMs: number): TradeSnapshot | null {
    const trades = this.state.get(symbol);
    if (!trades) return null;

    return {
      symbol,
      trades,
      stats: computeStats(trades, nowMs),
    };
  }

  clear(symbol: TradingSymbol): void {
    this.state.delete(symbol);
  }
}

function computeStats(trades: readonly Trade[], nowMs: number): TradeStats {
  const cutoff = nowMs - ONE_MINUTE_MS;
  let volume1mBuy = 0;
  let volume1mSell = 0;
  let count1m = 0;

  for (const t of trades) {
    if (t.timestamp < cutoff) break; // trades are newest-first; once past cutoff, done
    count1m++;
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
