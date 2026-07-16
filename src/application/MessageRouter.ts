import type { InboundMessage, Channel } from '@/shared/types';
import type { SubscriptionHandler } from './SubscriptionHandler';
import type { MessageRouterPort, ChannelHandler } from '@/domain/ports/MessageRouterPort';

export type ChannelMessageHandler = ChannelHandler;

// Maps Delta Exchange wire channel names → internal Channel names.
// Incoming messages carry wire names; handlers are registered with internal names.
const WIRE_TO_CHANNEL: Readonly<Partial<Record<string, Channel>>> = {
  'v2/ticker': 'ticker',
  l2_orderbook: 'orderbook',
  all_trades: 'trades',
  subscription: 'subscription',
  connection: 'connection',
};

export class MessageRouter implements MessageRouterPort {
  private readonly handlers = new Map<Channel, Set<ChannelMessageHandler>>();

  constructor(private readonly subscriptionHandler: SubscriptionHandler) {
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
    const message = this.parse(raw);
    if (!message) return;

    const channel = WIRE_TO_CHANNEL[message.channel as string];
    if (!channel) return;

    const handlers = this.handlers.get(channel);
    if (!handlers || handlers.size === 0) return;

    handlers.forEach((h) => h(message));
  }

  private parse(raw: string): InboundMessage | null {
    try {
      const parsed: unknown = JSON.parse(raw);
      return isInboundMessage(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}

function isInboundMessage(value: unknown): value is InboundMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['type'] === 'string' &&
    typeof (value as Record<string, unknown>)['channel'] === 'string' &&
    typeof (value as Record<string, unknown>)['timestamp'] === 'number'
  );
}
