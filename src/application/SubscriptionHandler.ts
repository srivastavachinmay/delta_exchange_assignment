import type { Channel, InboundMessage, SubscriptionAckMessage, TradingSymbol, UnsubscriptionAckMessage } from '@/shared/types';

export interface SubscriptionCallbacks {
  onAcknowledge(symbols: TradingSymbol[], channels: Channel[]): void;
  onRemove(symbols: TradingSymbol[], channels: Channel[]): void;
}

export class SubscriptionHandler {
  constructor(private readonly callbacks: SubscriptionCallbacks) {}

  handle(message: InboundMessage): void {
    if (isSubscriptionAck(message)) {
      this.callbacks.onAcknowledge(message.payload.symbols, message.payload.channels);
      return;
    }

    if (isUnsubscriptionAck(message)) {
      this.callbacks.onRemove(message.payload.symbols, message.payload.channels);
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
