import { z } from 'zod';
import { publicUserSchema } from './auth';
import { LIMITS, MEETUP_STATUSES, MESSAGE_TYPES } from './constants';

/**
 * The `meta` blob on a `meetup_proposal` message. Keeping it on the message
 * (rather than its own table) means the proposal and the conversation stay in
 * one ordered stream, which is what the chat screen renders.
 */
export const meetupMetaSchema = z.object({
  place: z.string().trim().min(2).max(120),
  /** ISO timestamp of the proposed meetup. */
  at: z.iso.datetime(),
  agreedPriceCents: z.number().int().min(LIMITS.minPriceCents).max(LIMITS.maxPriceCents),
  status: z.enum(MEETUP_STATUSES),
});
export type MeetupMeta = z.infer<typeof meetupMetaSchema>;

export const messageSchema = z.object({
  id: z.uuid(),
  conversationId: z.uuid(),
  senderId: z.uuid(),
  body: z.string(),
  type: z.enum(MESSAGE_TYPES),
  meta: meetupMetaSchema.nullable(),
  readAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  /** Echoed back on `message:new` so the sender can reconcile its optimistic row. */
  clientId: z.string().max(64).nullable(),
});
export type Message = z.infer<typeof messageSchema>;

export const conversationSchema = z.object({
  id: z.uuid(),
  listing: z.object({
    id: z.uuid(),
    title: z.string(),
    priceCents: z.number().int(),
    photoUrl: z.url().nullable(),
    status: z.string(),
  }),
  otherUser: publicUserSchema,
  lastMessage: messageSchema.nullable(),
  unreadCount: z.number().int(),
  lastMessageAt: z.iso.datetime().nullable(),
});
export type Conversation = z.infer<typeof conversationSchema>;

/** Buyers open a conversation from the listing detail screen. */
export const startConversationSchema = z.object({
  listingId: z.uuid(),
  body: z.string().trim().min(1).max(LIMITS.messageBodyMax).optional(),
});
export type StartConversationInput = z.infer<typeof startConversationSchema>;

export const sendMessageSchema = z.object({
  conversationId: z.uuid(),
  body: z.string().trim().min(1).max(LIMITS.messageBodyMax),
  /** Client-generated id for optimistic sends; the server echoes it back. */
  clientId: z.string().min(1).max(64),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const proposeMeetupSchema = z.object({
  conversationId: z.uuid(),
  place: z.string().trim().min(2).max(120),
  at: z.iso.datetime(),
  agreedPriceCents: z.number().int().min(LIMITS.minPriceCents).max(LIMITS.maxPriceCents),
  clientId: z.string().min(1).max(64),
});
export type ProposeMeetupInput = z.infer<typeof proposeMeetupSchema>;

export const respondMeetupSchema = z.object({
  conversationId: z.uuid(),
  messageId: z.uuid(),
  response: z.enum(['accepted', 'declined']),
});
export type RespondMeetupInput = z.infer<typeof respondMeetupSchema>;

export const typingSchema = z.object({
  conversationId: z.uuid(),
  isTyping: z.boolean(),
});
export type TypingInput = z.infer<typeof typingSchema>;

export const markReadSchema = z.object({
  conversationId: z.uuid(),
  /** Everything in the conversation up to and including this message is read. */
  messageId: z.uuid(),
});
export type MarkReadInput = z.infer<typeof markReadSchema>;
