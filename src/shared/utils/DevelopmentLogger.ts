type EmitLevel = 'log' | 'warn' | 'error';
type LogCategory = 'connection' | 'reconnect' | 'subscription' | 'message' | 'error';

const isDev: boolean = import.meta.env.DEV;

class DevelopmentLogger {
  // Market data frames arrive at 200+ msg/s — off by default to avoid flooding.
  verbose = false;

  private emit(level: EmitLevel, category: LogCategory, message: string, data?: unknown): void {
    if (!isDev) return;
    const tag = `[WS:${category}]`;
    if (data !== undefined) {
      // eslint-disable-next-line no-console
      console[level](tag, message, data);
    } else {
      // eslint-disable-next-line no-console
      console[level](tag, message);
    }
  }

  connecting(url: string): void {
    this.emit('log', 'connection', `connecting → ${url}`);
  }

  connected(attempt: number): void {
    const suffix = attempt > 0 ? ` (after ${attempt} reconnect${attempt === 1 ? '' : 's'})` : '';
    this.emit('log', 'connection', `connected${suffix}`);
  }

  closed(code: number, reason: string, intentional: boolean): void {
    const description = describeCloseCode(code);
    this.emit(
      intentional ? 'log' : 'warn',
      'connection',
      `closed [${code} ${description}]${reason ? ` — "${reason}"` : ''}${intentional ? ' (intentional)' : ''}`,
    );
  }

  socketError(): void {
    this.emit('error', 'error', 'socket error event (close event will follow with code)');
  }

  scheduleReconnect(attempt: number, max: number, delayMs: number): void {
    this.emit('warn', 'reconnect', `attempt ${attempt}/${max} scheduled in ${delayMs}ms`);
  }

  maxReconnectExhausted(max: number): void {
    this.emit('error', 'reconnect', `exhausted after ${max} attempts — connection abandoned`);
  }

  subscribeIntent(channel: string, symbols: string[]): void {
    this.emit('log', 'subscription', `subscribe ${channel}`, symbols);
  }

  unsubscribeIntent(channel: string, symbols: string[]): void {
    this.emit('log', 'subscription', `unsubscribe ${channel}`, symbols);
  }

  subscriptionReplay(channelCount: number): void {
    this.emit('log', 'subscription', `replay ${channelCount} channel(s) after reconnect`);
  }

  subscriptionAck(channels: string[], symbols: string[]): void {
    this.emit('log', 'subscription', `ack ${channels.join(',')}`, symbols);
  }

  subscriptionRemove(channels: string[], symbols: string[]): void {
    this.emit('log', 'subscription', `remove ${channels.join(',')}`, symbols);
  }

  incomingMessage(wireChannel: string, symbol?: string): void {
    if (!this.verbose) return;
    this.emit('log', 'message', symbol ? `${wireChannel} [${symbol}]` : wireChannel);
  }

  parseFailureJson(rawSnippet: string): void {
    this.emit('error', 'error', 'invalid JSON frame', rawSnippet);
  }

  parseFailureShape(parsedSnippet: string): void {
    this.emit('warn', 'error', 'frame missing type/channel/timestamp — dropped', parsedSnippet);
  }

  unknownWireChannel(wireChannel: string): void {
    this.emit('warn', 'error', `unknown wire channel "${wireChannel}" — no handler registered`);
  }

  noHandlersForChannel(channel: string): void {
    if (!this.verbose) return;
    this.emit('warn', 'error', `channel "${channel}" has no handlers`);
  }

  sendDropped(reason: string): void {
    this.emit('warn', 'error', `send dropped: ${reason}`);
  }
}

function describeCloseCode(code: number): string {
  switch (code) {
    case 1000: return 'normal';
    case 1001: return 'going away';
    case 1002: return 'protocol error';
    case 1003: return 'unsupported data';
    case 1005: return 'no status received';
    case 1006: return 'abnormal closure / network failure';
    case 1007: return 'invalid payload data';
    case 1008: return 'policy violation';
    case 1009: return 'message too large';
    case 1011: return 'internal server error';
    case 1012: return 'service restart';
    case 1013: return 'try again later';
    default:   return code >= 4000 ? 'application-defined' : 'unknown';
  }
}

export const logger = new DevelopmentLogger();
