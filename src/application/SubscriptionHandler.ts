/**
 * SubscriptionHandler — manages server acknowledgement of subscriptions.
 *
 * Responsibility:
 * - Receives subscription ack/nack messages from the MessageRouter
 * - Updates the subscriptionStore with confirmed subscriptions
 *
 * The separation between WS-level subscription tracking (WebSocketManager)
 * and server-acknowledged subscription tracking (this class + subscriptionStore)
 * is intentional:
 * - WS Manager tracks what WE sent (optimistic)
 * - This handler tracks what the SERVER confirmed (authoritative)
 *
 * Components should read from subscriptionStore, not WebSocketManager,
 * to avoid showing stale data before the server has confirmed.
 */

import type { InboundMessage, SubscriptionAckMessage, UnsubscriptionAckMessage } from '@/shared/types';
import { useSubscriptionStore } from '@/app/stores/subscriptionStore';

export class SubscriptionHandler {
  handle(message: InboundMessage): void {
    if (isSubscriptionAck(message)) {
      useSubscriptionStore
        .getState()
        .acknowledge(message.payload.symbols, message.payload.channels);
      return;
    }

    if (isUnsubscriptionAck(message)) {
      useSubscriptionStore
        .getState()
        .remove(message.payload.symbols, message.payload.channels);
      return;
    }
  }
}

function isSubscriptionAck(msg: InboundMessage): msg is SubscriptionAckMessage {
  return msg.type === 'subscribed' && msg.channel === 'subscription';
}

function isUnsubscriptionAck(msg: InboundMessage): msg is UnsubscriptionAckMessage {
  return msg.type === 'unsubscribed' && msg.channel === 'subscription';
}
