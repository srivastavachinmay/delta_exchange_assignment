/**
 * WebSocket connection constants.
 *
 * Backoff: 1s → 2s → 4s → 8s → 16s → 30s (cap).
 * 30s cap matches session timeout behavior on most exchanges.
 *
 * Note: WS_URL is deployment config — see infrastructure/config/SymbolConfig.ts.
 */

export const RECONNECT_BASE_MS = 1_000;
export const RECONNECT_MAX_MS = 30_000;
export const RECONNECT_MULTIPLIER = 2;
export const RECONNECT_MAX_ATTEMPTS = 10;

export const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Compute exponential backoff delay for reconnect attempt (0-indexed).
 * Capped at RECONNECT_MAX_MS.
 */
export function computeBackoffDelay(attempt: number): number {
  return Math.min(
    RECONNECT_BASE_MS * Math.pow(RECONNECT_MULTIPLIER, attempt),
    RECONNECT_MAX_MS,
  );
}
