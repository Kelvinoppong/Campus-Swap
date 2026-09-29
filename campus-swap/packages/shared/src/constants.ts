/**
 * Values that both the app and the API must agree on. Anything in here that
 * maps to a database column also exists as a Prisma enum in apps/api.
 */

/**
 * Anything a student would hand to another student. Deliberately broad: a
 * PlayStation, a winter coat, a conference pass and a calculus textbook all
 * belong here, so the taxonomy is general-purpose rather than three verticals.
 */
export const LISTING_CATEGORIES = [
  'textbooks',
  'tech',
  'dorm',
  'fashion',
  'beauty',
  'tickets',
  'sports',
  'music',
  'rides',
  'other',
] as const;
export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

/**
 * Who an item is cut for. Only meaningful for clothing, shoes and beauty, so
 * it is optional on every listing and drives a feed filter, not a separate app.
 */
export const LISTING_AUDIENCES = ['men', 'women', 'unisex'] as const;
export type ListingAudience = (typeof LISTING_AUDIENCES)[number];

/**
 * How the item changes hands. Campus meetups are the default and the safe path,
 * but a conference pass in another country can only move digitally.
 */
export const DELIVERY_METHODS = ['meetup', 'digital', 'shipping'] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

/** How far an event ticket reaches: a dorm show, a city gig, or a global conference. */
export const EVENT_SCOPES = ['campus', 'city', 'global'] as const;
export type EventScope = (typeof EVENT_SCOPES)[number];

/** How a ticket is actually handed over. */
export const TICKET_TRANSFER_METHODS = ['in_person', 'digital_transfer', 'email_pdf'] as const;
export type TicketTransferMethod = (typeof TICKET_TRANSFER_METHODS)[number];

export const LISTING_CONDITIONS = ['like_new', 'good', 'fair'] as const;
export type ListingCondition = (typeof LISTING_CONDITIONS)[number];

export const LISTING_STATUSES = ['active', 'pending', 'sold', 'removed'] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const USER_STATUSES = ['active', 'suspended'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const USER_ROLES = ['student', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MESSAGE_TYPES = ['text', 'meetup_proposal', 'system'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const MEETUP_STATUSES = ['proposed', 'accepted', 'declined'] as const;
export type MeetupStatus = (typeof MEETUP_STATUSES)[number];

export const REPORT_TARGET_TYPES = ['listing', 'user', 'message'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const REPORT_STATUSES = ['open', 'actioned', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_REASONS = [
  'prohibited_item',
  'scam',
  'harassment',
  'wrong_category',
  'spam',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** Human-readable labels, so the app never hard-codes a category string. */
export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  textbooks: 'Books & Study',
  tech: 'Tech & Gaming',
  dorm: 'Dorm & Furniture',
  fashion: 'Clothing & Shoes',
  beauty: 'Beauty & Care',
  tickets: 'Tickets & Events',
  sports: 'Sports & Outdoors',
  music: 'Music & Instruments',
  rides: 'Bikes & Scooters',
  other: 'Everything Else',
};

/** Short form for the feed's category chips, where horizontal space is tight. */
export const CATEGORY_CHIP_LABELS: Record<ListingCategory, string> = {
  textbooks: 'Books',
  tech: 'Tech',
  dorm: 'Dorm',
  fashion: 'Clothing',
  beauty: 'Beauty',
  tickets: 'Tickets',
  sports: 'Sports',
  music: 'Music',
  rides: 'Rides',
  other: 'Other',
};

export const AUDIENCE_LABELS: Record<ListingAudience, string> = {
  men: "Men's",
  women: "Women's",
  unisex: 'Unisex',
};

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  meetup: 'Meet on campus',
  digital: 'Digital transfer',
  shipping: 'Ships to buyer',
};

export const EVENT_SCOPE_LABELS: Record<EventScope, string> = {
  campus: 'On campus',
  city: 'In the city',
  global: 'Anywhere in the world',
};

export const TICKET_TRANSFER_LABELS: Record<TicketTransferMethod, string> = {
  in_person: 'Handed over in person',
  digital_transfer: 'Transferred in the ticket app',
  email_pdf: 'Emailed as a PDF',
};

/**
 * Categories where a size and an audience are worth asking for. The sell form
 * shows those two fields only for these, so posting a monitor stays two taps.
 */
export const SIZED_CATEGORIES: readonly ListingCategory[] = ['fashion', 'sports'];
export const AUDIENCE_CATEGORIES: readonly ListingCategory[] = ['fashion', 'beauty', 'sports'];

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  like_new: 'Like new',
  good: 'Good',
  fair: 'Fair',
};

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  prohibited_item: 'Prohibited item',
  scam: 'Scam or fraud',
  harassment: 'Harassment',
  wrong_category: 'Wrong category',
  spam: 'Spam',
  other: 'Something else',
};

export const LIMITS = {
  /** A listing carries at most four photos (build plan, MVP scope). */
  maxListingPhotos: 4,
  maxUploadBytes: 5 * 1024 * 1024,
  listingTitleMax: 80,
  listingDescriptionMax: 2000,
  messageBodyMax: 2000,
  reviewCommentMax: 500,
  /** $0.00 – $5,000.00, stored as integer cents. */
  minPriceCents: 0,
  maxPriceCents: 500_000,
  signInCodeLength: 6,
  signInCodeTtlMinutes: 10,
  signInCodeMaxAttempts: 5,
  feedPageSize: 20,
  messagePageSize: 30,
} as const;

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const;
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/** Resize widths the BullMQ worker produces for every uploaded photo. */
export const IMAGE_RENDITIONS = { thumb: 400, full: 1200 } as const;

export const API_PREFIX = 'v1';
