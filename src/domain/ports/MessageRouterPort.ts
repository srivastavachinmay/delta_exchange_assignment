import type { Channel, InboundMessage } from '@/shared/types';

export type ChannelHandler = (message: InboundMessage) => void;

export interface MessageRouterPort {
  route(raw: string): void;
  registerHandler(channel: Channel, handler: ChannelHandler): void;
}
