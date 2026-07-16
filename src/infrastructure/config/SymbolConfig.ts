/**
 * Runtime infrastructure configuration.
 * Distinct from symbol metadata (shared/constants/symbols.ts) which is
 * business domain config — this is deployment/environment config.
 */

export const INFRASTRUCTURE_CONFIG = {
  wsUrl: import.meta.env['VITE_WS_URL'] as string | undefined ?? 'wss://socket.delta.exchange',
  /** Enable verbose WS message logging in development. */
  debugWs: import.meta.env.DEV,
} as const;
