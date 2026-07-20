import type { InboundMessage, Channel } from '@/shared/types';
import type { SubscriptionHandler } from './SubscriptionHandler';
import type { MessageRouterPort, ChannelHandler } from '@/domain/ports/MessageRouterPort';
import type { IMessageQueue } from './scheduler/MessageQueue';
import { logger } from '@/shared/utils/DevelopmentLogger';

export type ChannelMessageHandler = ChannelHandler;

const WIRE_TO_CHANNEL: Readonly<Partial<Record<string, Channel>>> = {
  'v2/ticker': 'ticker',
  l2_orderbook: 'orderbook',
  all_trades: 'trades',
  subscription: 'subscription',
  connection: 'connection',
};

// Frames that pass JSON.parse but lack the InboundMessage shape — suppress shape warnings for these.
const EXPECTED_NON_EVENT_TYPES = new Set(['heartbeat', 'heartbeat_response']);

// Market data channels that are buffered through the queue rather than dispatched immediately.
// Control channels (subscription, connection) always dispatch directly so they are never delayed.
const MARKET_DATA_CHANNELS: ReadonlySet<Channel> = new Set(['ticker', 'orderbook', 'trades']);

export class MessageRouter implements MessageRouterPort {
  private readonly handlers = new Map<Channel, Set<ChannelMessageHandler>>();
  private readonly marketDataQueue: IMessageQueue<InboundMessage> | null;

  constructor(
    private readonly subscriptionHandler: SubscriptionHandler,
    marketDataQueue?: IMessageQueue<InboundMessage>,
  ) {
    this.marketDataQueue = marketDataQueue ?? null;
    this.registerHandler('subscription', (msg) => {
      this.subscriptionHandler.handle(msg);
    });
  }

  registerHandler(channel: Channel, handler: ChannelMessageHandler): void {
    let set = this.handlers.get(channel);
    if (!set) {
      set = new Set<ChannelMessageHandler>();
      this.handlers.set(channel, set);
    }
    set.add(handler);
  }

  removeHandler(channel: Channel): void {
    this.handlers.delete(channel);
  }

  route(raw: string): void {
    const message = this._parse(raw);
    if (!message) return;

    // v2/ticker uses `type` as the wire discriminator instead of `channel`.
    const wireChannel = (message.channel ?? message.type) as string;
    const channel = WIRE_TO_CHANNEL[wireChannel];

    if (!channel) {
      logger.unknownWireChannel(wireChannel);
      return;
    }

    if (logger.verbose) logger.incomingMessage(wireChannel, extractSymbol(message));

    if (this.marketDataQueue && MARKET_DATA_CHANNELS.has(channel)) {
      this.marketDataQueue.enqueue(message);
      return;
    }

    const handlers = this.handlers.get(channel);
    if (!handlers || handlers.size === 0) {
      logger.noHandlersForChannel(channel);
      return;
    }

    handlers.forEach((h) => h(message));
  }

  private _parse(raw: string): InboundMessage | null {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      logger.parseFailureJson(raw.slice(0, 120));
      return null;
    }

    if (!isInboundMessage(parsed)) {
      const type = extractType(parsed);
      if (!EXPECTED_NON_EVENT_TYPES.has(type)) {
        logger.parseFailureShape(JSON.stringify(parsed).slice(0, 120));
      }
      return null;
    }

    return parsed;
  }
}

function isInboundMessage(value: unknown): value is InboundMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['type'] === 'string' &&
    typeof (value as Record<string, unknown>)['timestamp'] === 'number'
  );
}

function extractType(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    const t = (value as Record<string, unknown>)['type'];
    if (typeof t === 'string') return t;
  }
  return '';
}

function extractSymbol(msg: InboundMessage): string | undefined {
  if ('symbol' in msg) {
    const sym = (msg as { symbol?: unknown }).symbol;
    return typeof sym === 'string' ? sym : undefined;
  }
  return undefined;
}
