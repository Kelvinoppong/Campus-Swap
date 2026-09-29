import { z } from 'zod';
import { publicUserSchema } from './auth';
import {
  DELIVERY_METHODS,
  EVENT_SCOPES,
  LIMITS,
  LISTING_AUDIENCES,
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  LISTING_STATUSES,
  TICKET_TRANSFER_METHODS,
} from './constants';
import { cursorPageQuerySchema } from './pagination';

export const listingPhotoSchema = z.object({
  id: z.uuid(),
  url: z.url(),
  thumbUrl: z.url().nullable(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  position: z.number().int().min(0).max(LIMITS.maxListingPhotos - 1),
});
export type ListingPhoto = z.infer<typeof listingPhotoSchema>;

/**
 * Event details for a ticket listing. `scope` is what lets one feed hold both
 * a Thursday dorm show and a conference pass in Berlin: campus tickets stay in
 * the local feed, global ones are searchable by anyone on the platform.
 */
export const ticketEventSchema = z.object({
  name: z.string().trim().min(2).max(120),
  scope: z.enum(EVENT_SCOPES),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime().nullable().optional(),
  venue: z.string().trim().max(120).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  /** ISO 3166-1 alpha-2, so "a conference anywhere in the world" is filterable. */
  country: z.string().trim().length(2).toUpperCase().nullable().optional(),
  isVirtual: z.boolean().default(false),
  quantity: z.number().int().min(1).max(10).default(1),
  transfer: z.enum(TICKET_TRANSFER_METHODS),
});
export type TicketEvent = z.infer<typeof ticketEventSchema>;

/**
 * Optional, category-dependent extras. Kept in one nullable JSON column rather
 * than a column per vertical, so adding a category later is not a migration.
 */
export const listingDetailsSchema = z.object({
  brand: z.string().trim().max(60).nullable().optional(),
  /** Free text on purpose: "M", "US 10.5", "34x32" are all valid answers. */
  size: z.string().trim().max(24).nullable().optional(),
  audience: z.enum(LISTING_AUDIENCES).nullable().optional(),
  color: z.string().trim().max(30).nullable().optional(),
  /** Required when `category` is `tickets`, ignored otherwise. */
  event: ticketEventSchema.nullable().optional(),
});
export type ListingDetails = z.infer<typeof listingDetailsSchema>;

export const listingSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string(),
  priceCents: z.number().int(),
  /** Optional "was $120 at the bookstore" comparison shown on the detail screen. */
  compareAtPriceCents: z.number().int().nullable(),
  category: z.enum(LISTING_CATEGORIES),
  condition: z.enum(LISTING_CONDITIONS),
  deliveryMethod: z.enum(DELIVERY_METHODS),
  /** Null when the item is handed over digitally or shipped. */
  meetupSpot: z.string().nullable(),
  details: listingDetailsSchema.nullable(),
  status: z.enum(LISTING_STATUSES),
  photos: z.array(listingPhotoSchema),
  seller: publicUserSchema,
  savedByMe: z.boolean(),
  savedCount: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Listing = z.infer<typeof listingSchema>;

/** The photo payload the client sends after uploading straight to storage. */
export const listingPhotoInputSchema = z.object({
  storageKey: z.string().min(1).max(512),
  width: z.number().int().positive().max(10_000),
  height: z.number().int().positive().max(10_000),
});
export type ListingPhotoInput = z.infer<typeof listingPhotoInputSchema>;

const listingFields = {
  title: z.string().trim().min(3).max(LIMITS.listingTitleMax),
  description: z.string().trim().max(LIMITS.listingDescriptionMax).default(''),
  priceCents: z.number().int().min(LIMITS.minPriceCents).max(LIMITS.maxPriceCents),
  compareAtPriceCents: z
    .number()
    .int()
    .min(LIMITS.minPriceCents)
    .max(LIMITS.maxPriceCents)
    .nullable()
    .optional(),
  category: z.enum(LISTING_CATEGORIES),
  condition: z.enum(LISTING_CONDITIONS),
  deliveryMethod: z.enum(DELIVERY_METHODS).default('meetup'),
  meetupSpot: z.string().trim().min(2).max(120).nullable().optional(),
  details: listingDetailsSchema.nullable().optional(),
  photos: z.array(listingPhotoInputSchema).min(1).max(LIMITS.maxListingPhotos),
};

const createListingObject = z.object(listingFields);

/**
 * Two rules the type system cannot express: a campus meetup needs a spot, and
 * a ticket needs an event. Both run on create and on edit.
 */
function checkCategoryRules(
  value: Partial<z.infer<typeof createListingObject>>,
  ctx: z.RefinementCtx,
): void {
  if (value.deliveryMethod === 'meetup' && value.meetupSpot == null) {
    ctx.addIssue({
      code: 'custom',
      path: ['meetupSpot'],
      message: 'Pick a public meetup spot, or choose digital or shipped delivery',
    });
  }
  if (value.category === 'tickets' && value.details?.event == null) {
    ctx.addIssue({
      code: 'custom',
      path: ['details', 'event'],
      message: 'Ticket listings need the event name, date and how the ticket transfers',
    });
  }
  if (
    value.compareAtPriceCents != null &&
    value.priceCents != null &&
    value.compareAtPriceCents <= value.priceCents
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['compareAtPriceCents'],
      message: 'The original price has to be higher than what you are asking',
    });
  }
}

export const createListingSchema = createListingObject.superRefine(checkCategoryRules);
export type CreateListingInput = z.infer<typeof createListingSchema>;

/**
 * Edits are partial. `status` is included so "mark as sold" is the same route,
 * but the API rejects anything other than active/pending/sold from the owner.
 */
export const updateListingSchema = createListingObject
  .partial()
  .extend({ status: z.enum(LISTING_STATUSES).optional() })
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Nothing to update' });
      return;
    }
    checkCategoryRules(value, ctx);
  });
export type UpdateListingInput = z.infer<typeof updateListingSchema>;

export const listingQuerySchema = cursorPageQuerySchema.extend({
  q: z.string().trim().max(120).optional(),
  category: z.enum(LISTING_CATEGORIES).optional(),
  audience: z.enum(LISTING_AUDIENCES).optional(),
  minPriceCents: z.coerce.number().int().min(0).optional(),
  maxPriceCents: z.coerce.number().int().min(0).optional(),
  /** Narrows the tickets category to campus, city or worldwide events. */
  eventScope: z.enum(EVENT_SCOPES).optional(),
  sellerId: z.uuid().optional(),
  status: z.enum(LISTING_STATUSES).optional(),
  savedOnly: z.stringbool().optional(),
  freeOnly: z.stringbool().optional(),
});
export type ListingQuery = z.infer<typeof listingQuerySchema>;
