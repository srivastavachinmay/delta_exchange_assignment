/**
 * MessageRouter — dispatches inbound WebSocket messages to channel handlers.
 *
 * Application layer responsibility:
 * - Receives raw JSON strings from the infrastructure adapter
 * - Parses and validates message shape
 * - Routes to the correct handler based on channel
 *
 * Future pipeline integration (Phase 5):
 * Currently, route() calls handlers directly.
 * After Phase 5, route() will enqueue into MessageQueue instead.
 * The RAF loop will drain the queue and call handlers once per frame.
 * Call sites don't change — only this class's route() implementation changes.
 *
 * Open/Closed: adding a new channel = register a new handler.
 * No modification to the routing switch.
 */

import type { InboundMessage, Channel } from '@/shared/types';
import type { SubscriptionHandler } from './SubscriptionHandler';

export type ChannelMessageHandler = (message: InboundMessage) => void;

export class MessageRouter {
  private readonly handlers = new Map<Channel, ChannelMessageHandler>();

  constructor(private readonly subscriptionHandler: SubscriptionHandler) {
    // Subscription acks are handled at the application layer.
    // Ticker/OrderBook/Trades handlers are registered in Phase 2/3/4.
    this.handlers.set('subscription', (msg) => {
      this.subscriptionHandler.handle(msg);
    });
  }

  /**
   * Register a handler for a specific channel.
   * Later phases call this to plug in their handlers.
   */
  registerHandler(channel: Channel, handler: ChannelMessageHandler): void {
    this.handlers.set(channel, handler);
  }

  /**
   * Parse a raw JSON string and dispatch to the correct handler.
   * Called by the WebSocketAdapter on every incoming message.
   *
   * Phase 5: replace direct dispatch with MessageQueue.enqueue().
   */
  route(raw: string): void {
    const message = this.parse(raw);
    if (!message) return;

    const handler = this.handlers.get(message.channel);
    if (!handler) {
      // Unknown channels are silently dropped — exchange may add new channels.
      return;
    }

    handler(message);
  }

  private parse(raw: string): InboundMessage | null {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isInboundMessage(parsed)) return null;
      return parsed;
    } catch {
      console.warn('[MessageRouter] JSON parse failure');
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
