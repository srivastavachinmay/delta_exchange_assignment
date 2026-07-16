/**
 * StoragePort — outbound driven port.
 *
 * The domain (via application use cases) persists user preferences through
 * this interface without knowing about localStorage, IndexedDB, or any
 * concrete storage mechanism.
 *
 * Use cases: last selected symbol, grouping preference, panel layout state.
 */

export interface StoragePort {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

/** Well-known storage keys. Avoids magic strings across the codebase. */
export const STORAGE_KEYS = {
  FOCUSED_SYMBOL: 'trading.focusedSymbol',
  ORDER_BOOK_GROUPING: 'trading.orderBookGrouping',
} as const;
