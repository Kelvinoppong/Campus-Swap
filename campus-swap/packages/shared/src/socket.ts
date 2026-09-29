import type {
  MarkReadInput,
  Message,
  ProposeMeetupInput,
  RespondMeetupInput,
  SendMessageInput,
  TypingInput,
} from './chat';

/**
 * One authenticated Socket.IO connection per signed-in phone. Everything else
 * goes over REST; chat is the only thing that needs a live channel.
 */
export const SOCKET_EVENTS = {
  join: 'conversation:join',
  leave: 'conversation:leave',
  sendMessage: 'message:send',
  newMessage: 'message:new',
  markRead: 'message:read',
  readReceipt: 'message:read:ack',
  typing: 'typing',
  typingUpdate: 'typing:update',
  proposeMeetup: 'meetup:propose',
  respondMeetup: 'meetup:respond',
  meetupUpdate: 'meetup:update',
  error: 'socket:error',
} as const;

export interface SocketAck<T = unknown> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

/** Events the client emits. Every one takes an ack callback. */
export interface ClientToServerEvents {
  [SOCKET_EVENTS.join]: (payload: { conversationId: string }, ack: AckFn<{ joined: true }>) => void;
  [SOCKET_EVENTS.leave]: (payload: { conversationId: string }, ack: AckFn<{ left: true }>) => void;
  [SOCKET_EVENTS.sendMessage]: (payload: SendMessageInput, ack: AckFn<Message>) => void;
  [SOCKET_EVENTS.markRead]: (payload: MarkReadInput, ack: AckFn<{ readCount: number }>) => void;
  [SOCKET_EVENTS.typing]: (payload: TypingInput) => void;
  [SOCKET_EVENTS.proposeMeetup]: (payload: ProposeMeetupInput, ack: AckFn<Message>) => void;
  [SOCKET_EVENTS.respondMeetup]: (payload: RespondMeetupInput, ack: AckFn<Message>) => void;
}

/** Events the server pushes into a conversation room. */
export interface ServerToClientEvents {
  [SOCKET_EVENTS.newMessage]: (message: Message) => void;
  [SOCKET_EVENTS.readReceipt]: (payload: {
    conversationId: string;
    readerId: string;
    readAt: string;
  }) => void;
  [SOCKET_EVENTS.typingUpdate]: (payload: {
    conversationId: string;
    userId: string;
    isTyping: boolean;
  }) => void;
  [SOCKET_EVENTS.meetupUpdate]: (message: Message) => void;
  [SOCKET_EVENTS.error]: (payload: { code: string; message: string }) => void;
}

type AckFn<T> = (response: SocketAck<T>) => void;

export const conversationRoom = (conversationId: string): string => `conversation:${conversationId}`;
export const userRoom = (userId: string): string => `user:${userId}`;
