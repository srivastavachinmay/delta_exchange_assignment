import type { TradingSymbol } from '@/shared/types';
import type { StoragePort } from '@/domain/ports/StoragePort';
import { STORAGE_KEYS } from '@/domain/ports/StoragePort';
import { isMarketSymbol } from '@/domain/valueObjects/MarketSymbol';

/**
 * FocusSymbolUseCase — switch the actively displayed trading symbol.
 *
 * Orchestrates: storage write + UI state update via injected callback.
 * The callback decouples the use case from Zustand — the composition root
 * injects `(symbol) => store.setFocusedSymbol(symbol)`.
 */
export class FocusSymbolUseCase {
  constructor(
    private readonly storage: StoragePort,
    private readonly onFocused: (symbol: TradingSymbol) => void,
  ) {}

  execute(symbol: TradingSymbol): void {
    if (!isMarketSymbol(symbol)) {
      console.warn(`[FocusSymbolUseCase] unsupported symbol: ${symbol}`);
      return;
    }
    this.storage.set(STORAGE_KEYS.FOCUSED_SYMBOL, symbol);
    this.onFocused(symbol);
  }

  /** Restore last focused symbol from storage. Falls back to BTCUSD. */
  restore(): TradingSymbol {
    const stored = this.storage.get<TradingSymbol>(STORAGE_KEYS.FOCUSED_SYMBOL);
    return stored && isMarketSymbol(stored) ? stored : 'BTCUSD';
  }
}
