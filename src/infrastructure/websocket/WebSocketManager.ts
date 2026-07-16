import type { OutboundMessage, ConnectionStatusCallbacks } from '@/shared/types';
import {
  computeBackoffDelay,
  RECONNECT_MAX_ATTEMPTS,
  HEARTBEAT_INTERVAL_MS,
} from '@/shared/constants/websocket';
import { INFRASTRUCTURE_CONFIG } from '@/infrastructure/config/SymbolConfig';

type RawMessageListener = (raw: string) => void;
type ReadyListener = () => void;

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

  private readonly listeners = new Set<RawMessageListener>();

  /**
   * Fired on every socket open, including reconnects.
   * SubscriptionManager registers here to replay desired subscriptions.
   */
  private readonly readyListeners = new Set<ReadyListener>();

  /** True when disconnect() was called intentionally — suppresses reconnect. */
  private intentionalDisconnect = false;

  /**
   * Status callbacks registered by the composition root.
   * Bridges WebSocketManager lifecycle events → connectionStore writes,
   * without Infrastructure depending on app/stores directly.
   */
  private statusCallbacks: ConnectionStatusCallbacks | null = null;

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Register status callbacks. Call this before connect().
   * The composition root (WebSocketProvider) wires these to connectionStore actions.
   */
  setStatusCallbacks(callbacks: ConnectionStatusCallbacks): void {
    this.statusCallbacks = callbacks;
  }

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) return;
    if (this.socket?.readyState === WebSocket.CONNECTING) return;

    this.intentionalDisconnect = false;
    this.statusCallbacks?.onStatus('connecting');
    this._openSocket();
  }

  disconnect(): void {
    this.intentionalDisconnect = true;
    this._clearTimers();
    this.socket?.close(1000, 'client disconnect');
    this.socket = null;
    this.reconnectAttempt = 0;
    this.statusCallbacks?.onStatus('disconnected');
  }

  send(message: OutboundMessage): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(message));
  }

  registerListener(listener: RawMessageListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: RawMessageListener): void {
    this.listeners.delete(listener);
  }

  registerReadyListener(listener: ReadyListener): void {
    this.readyListeners.add(listener);
  }

  removeReadyListener(listener: ReadyListener): void {
    this.readyListeners.delete(listener);
  }

  destroy(): void {
    this.intentionalDisconnect = true;
    this._clearTimers();
    this.socket?.close(1000, 'client destroy');
    this.socket = null;
    this.reconnectAttempt = 0;
    this.listeners.clear();
    this.readyListeners.clear();
    this.statusCallbacks?.onStatus('disconnected');
    WebSocketManager.instance = null;
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  private _openSocket(): void {
    const socket = new WebSocket(INFRASTRUCTURE_CONFIG.wsUrl);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.statusCallbacks?.onConnected(Date.now());
      this._startHeartbeat();
      this.readyListeners.forEach((l) => l());
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
      this.statusCallbacks?.onError('WebSocket error');
    };
  }

  private _scheduleReconnect(): void {
    if (this.reconnectAttempt >= RECONNECT_MAX_ATTEMPTS) {
      this.statusCallbacks?.onError('Max reconnect attempts reached');
      return;
    }

    const delay = computeBackoffDelay(this.reconnectAttempt);
    this.statusCallbacks?.onReconnecting(this.reconnectAttempt + 1);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempt++;
      this._openSocket();
    }, delay);
  }

  private _startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
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
