/**
 * WebSocketManager — singleton managing the exchange WebSocket connection.
 *
 * This is pure infrastructure: no React, no domain logic, no Zustand.
 * It manages the TCP-level WebSocket lifecycle only.
 *
 * Responsibilities:
 * - Single connection (idempotent connect())
 * - Exponential backoff reconnect: 1s → 2s → 4s → 8s → 16s → 30s (cap)
 * - Heartbeat to keep the connection alive (exchanges close idle connections)
 * - Subscription replay on reconnect (server forgets subscriptions on disconnect)
 * - Raw message listener registration (consumed by WebSocketAdapter)
 *
 * What this class does NOT do:
 * - Parse or understand messages (that's MessageRouter)
 * - Write to any store (that's SubscriptionHandler / channel handlers)
 * - Import React (intentional — survives React tree unmounts)
 *
 * Usage:
 *   const mgr = WebSocketManager.getInstance()
 *   mgr.connect()
 *   mgr.subscribe('BTCUSD', 'ticker')
 */

import type { Channel, TradingSymbol, OutboundMessage } from '@/shared/types';
import {
  WS_URL,
  computeBackoffDelay,
  RECONNECT_MAX_ATTEMPTS,
  HEARTBEAT_INTERVAL_MS,
} from '@/shared/constants/websocket';
import { useConnectionStore } from '@/app/stores/connectionStore';

type RawMessageListener = (raw: string) => void;

export class WebSocketManager {
  // -------------------------------------------------------------------------
  // Singleton
  // -------------------------------------------------------------------------

  private static instance: WebSocketManager | null = null;

  static getInstance(): WebSocketManager {
    WebSocketManager.instance ??= new WebSocketManager();
    return WebSocketManager.instance;
  }

  /** Reset singleton — test use only. */
  static _resetForTesting(): void {
    WebSocketManager.instance?.disconnect();
    WebSocketManager.instance = null;
  }

  // -------------------------------------------------------------------------
  // Instance state
  // -------------------------------------------------------------------------

  private socket: WebSocket | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Active subscription registry. Keyed by `${symbol}:${channel}`.
   * Persists across reconnects — replayed in _replaySubscriptions().
   */
  private readonly subscriptions = new Map<
    string,
    { symbol: TradingSymbol; channel: Channel }
  >();

  private readonly listeners = new Set<RawMessageListener>();

  /** True when disconnect() was called intentionally — suppresses reconnect. */
  private intentionalDisconnect = false;

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) return;
    if (this.socket?.readyState === WebSocket.CONNECTING) return;

    this.intentionalDisconnect = false;
    useConnectionStore.getState().setStatus('connecting');
    this._openSocket();
  }

  disconnect(): void {
    this.intentionalDisconnect = true;
    this._clearTimers();
    this.socket?.close(1000, 'client disconnect');
    this.socket = null;
    this.reconnectAttempt = 0;
    useConnectionStore.getState().setStatus('disconnected');
  }

  subscribe(symbol: TradingSymbol, channel: Channel): void {
    const key = `${symbol}:${channel}`;
    if (this.subscriptions.has(key)) return;

    this.subscriptions.set(key, { symbol, channel });
    this._send({ type: 'subscribe', payload: { channels: [channel], symbols: [symbol] } });
  }

  unsubscribe(symbol: TradingSymbol, channel: Channel): void {
    const key = `${symbol}:${channel}`;
    if (!this.subscriptions.has(key)) return;

    this.subscriptions.delete(key);
    this._send({ type: 'unsubscribe', payload: { channels: [channel], symbols: [symbol] } });
  }

  addListener(listener: RawMessageListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: RawMessageListener): void {
    this.listeners.delete(listener);
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  private _openSocket(): void {
    const socket = new WebSocket(WS_URL);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      useConnectionStore.getState().setStatus('connected');
      this._startHeartbeat();
      this._replaySubscriptions();
    };

    socket.onmessage = ({ data }: MessageEvent<string>) => {
      this.listeners.forEach((l) => l(data));
    };

    socket.onclose = ({ code }) => {
      this._stopHeartbeat();
      if (this.intentionalDisconnect) return;

      console.info(`[WebSocketManager] closed (code=${code}), scheduling reconnect`);
      this._scheduleReconnect();
    };

    socket.onerror = () => {
      // onerror always precedes onclose — let onclose handle reconnect
      useConnectionStore.getState().setError('WebSocket error');
    };
  }

  private _send(message: OutboundMessage): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(message));
  }

  private _scheduleReconnect(): void {
    if (this.reconnectAttempt >= RECONNECT_MAX_ATTEMPTS) {
      useConnectionStore.getState().setError('Max reconnect attempts reached');
      return;
    }

    const delay = computeBackoffDelay(this.reconnectAttempt);
    useConnectionStore.getState().setReconnecting(this.reconnectAttempt + 1);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempt++;
      this._openSocket();
    }, delay);
  }

  private _replaySubscriptions(): void {
    if (this.subscriptions.size === 0) return;

    const symbols = new Set<TradingSymbol>();
    const channels = new Set<Channel>();

    this.subscriptions.forEach(({ symbol, channel }) => {
      symbols.add(symbol);
      channels.add(channel);
    });

    this._send({
      type: 'subscribe',
      payload: { channels: [...channels], symbols: [...symbols] },
    });
  }

  private _startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      // Delta Exchange heartbeat format — replace with exchange-specific ping if required
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private _stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private _clearTimers(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this._stopHeartbeat();
  }
}

/** Module-level singleton. Import this everywhere — not the class. */
export const wsManager = WebSocketManager.getInstance();
