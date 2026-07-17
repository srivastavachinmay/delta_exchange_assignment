import type { OutboundMessage, ConnectionStatusCallbacks } from '@/shared/types';
import {
  computeBackoffDelay,
  RECONNECT_MAX_ATTEMPTS,
  HEARTBEAT_INTERVAL_MS,
} from '@/shared/constants/websocket';
import { INFRASTRUCTURE_CONFIG } from '@/infrastructure/config/SymbolConfig';
import { logger } from '@/shared/utils/DevelopmentLogger';

// Pre-serialized — heartbeat bypasses typed send() because it is a transport-level
// concern, not a subscription-protocol message.
const HEARTBEAT_PING = JSON.stringify({ type: 'heartbeat' });

type RawMessageListener = (raw: string) => void;
type ReadyListener = () => void;

export class WebSocketManager {
  private static instance: WebSocketManager | null = null;

  static getInstance(): WebSocketManager {
    WebSocketManager.instance ??= new WebSocketManager();
    return WebSocketManager.instance;
  }

  /** Test use only. */
  static _resetForTesting(): void {
    WebSocketManager.instance?.disconnect();
    WebSocketManager.instance = null;
  }

  private socket: WebSocket | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  private readonly listeners = new Set<RawMessageListener>();
  // SubscriptionManager registers here to replay desired subscriptions on every open.
  private readonly readyListeners = new Set<ReadyListener>();
  // Suppresses reconnect when close is caller-initiated.
  private intentionalDisconnect = false;
  // Wired by the composition root — keeps Infrastructure free of app/stores imports.
  private statusCallbacks: ConnectionStatusCallbacks | null = null;

  setStatusCallbacks(callbacks: ConnectionStatusCallbacks): void {
    this.statusCallbacks = callbacks;
  }

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) return;
    if (this.socket?.readyState === WebSocket.CONNECTING) return;

    this.intentionalDisconnect = false;
    this.statusCallbacks?.onStatus('connecting');
    logger.connecting(INFRASTRUCTURE_CONFIG.wsUrl);
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

  // Drops with a dev warning if the socket is not open — callers need no guard.
  send(message: OutboundMessage): void {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      const state = this.socket ? readyStateLabel(this.socket.readyState) : 'no socket';
      logger.sendDropped(`socket is ${state}`);
      return;
    }
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

  private _openSocket(): void {
    const socket = new WebSocket(INFRASTRUCTURE_CONFIG.wsUrl);
    this.socket = socket;

    socket.onopen = () => {
      if (this.socket !== socket) return;
      const attempt = this.reconnectAttempt;
      this.reconnectAttempt = 0;
      this.statusCallbacks?.onConnected(Date.now());
      logger.connected(attempt);
      this._startHeartbeat();
      this.readyListeners.forEach((l) => l());
    };

    socket.onmessage = ({ data }: MessageEvent<string>) => {
      if (this.socket !== socket) return;
      this.listeners.forEach((l) => l(data));
    };

    socket.onclose = ({ code, reason, wasClean }: CloseEvent) => {
      if (this.socket !== socket) return;
      this._stopHeartbeat();
      logger.closed(code, reason, this.intentionalDisconnect || wasClean);
      if (this.intentionalDisconnect) return;
      this._scheduleReconnect();
    };

    socket.onerror = () => {
      if (this.socket !== socket) return;
      logger.socketError();
      // onerror always precedes onclose — let onclose drive reconnect and status.
      this.statusCallbacks?.onError('WebSocket error');
    };
  }

  private _scheduleReconnect(): void {
    if (this.reconnectAttempt >= RECONNECT_MAX_ATTEMPTS) {
      logger.maxReconnectExhausted(RECONNECT_MAX_ATTEMPTS);
      this.statusCallbacks?.onError('Max reconnect attempts reached');
      return;
    }

    const delay = computeBackoffDelay(this.reconnectAttempt);
    const nextAttempt = this.reconnectAttempt + 1;

    logger.scheduleReconnect(nextAttempt, RECONNECT_MAX_ATTEMPTS, delay);
    this.statusCallbacks?.onReconnecting(nextAttempt);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempt++;
      this._openSocket();
    }, delay);
  }

  private _startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this._sendHeartbeatPing();
    }, HEARTBEAT_INTERVAL_MS);
  }

  private _sendHeartbeatPing(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(HEARTBEAT_PING);
    }
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

function readyStateLabel(state: number): string {
  switch (state) {
    case WebSocket.CONNECTING: return 'CONNECTING';
    case WebSocket.OPEN:       return 'OPEN';
    case WebSocket.CLOSING:    return 'CLOSING';
    case WebSocket.CLOSED:     return 'CLOSED';
    default:                   return `unknown(${state})`;
  }
}

/** Import this singleton everywhere — not the class directly. */
export const wsManager = WebSocketManager.getInstance();
