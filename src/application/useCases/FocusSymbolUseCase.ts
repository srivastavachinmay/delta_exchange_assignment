/**
 * FocusSymbolUseCase — switch the actively displayed trading symbol.
 *
 * Responsibility:
 * - Persist the focused symbol to storage (survives page reload)
 * - Trigger subscription changes if needed (unsubscribe old, subscribe new)
 * - Update any relevant UI state
 *
 * This is a use case (application service), not a domain service.
 * It orchestrates: storage write + subscription change + UI state change.
 * Domain services (engines) are not involved here — no market data transforms.
 *
 * Phase 2: implement execute() once symbol state store is established.
 */

import type { TradingSymbol } from '@/shared/types';
import type { StoragePort } from '@/domain/ports/StoragePort';
import { STORAGE_KEYS } from '@/domain/ports/StoragePort';

export class FocusSymbolUseCase {
  constructor(private readonly storage: StoragePort) {}

  /**
   * Switch the active symbol.
   *
   * TODO Phase 2:
   * - Unsubscribe previous symbol's channels
   * - Subscribe new symbol's channels
   * - Persist to storage
   * - Update focused symbol in app state
   */
  execute(_symbol: TradingSymbol): void {
    throw new Error('FocusSymbolUseCase not implemented — Phase 2');
  }

  /**
   * Restore last focused symbol from storage on app startup.
   * Falls back to BTCUSD if nothing stored.
   */
  restore(): TradingSymbol {
    const stored = this.storage.get<TradingSymbol>(STORAGE_KEYS.FOCUSED_SYMBOL);
    return stored ?? 'BTCUSD';
  }
}
