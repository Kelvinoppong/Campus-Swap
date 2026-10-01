import { z } from 'zod';

import { listingSchema } from './listings';

/**
 * Visual discovery: both "items that look like this one" and plain-English
 * photo search return the same shape, because both are a nearest-neighbour
 * lookup against the same CLIP embedding index.
 */
export const scoredListingSchema = z.object({
  listing: listingSchema,
  /**
   * Cosine similarity, higher is closer. Useful for ordering and for debugging,
   * but it is not comparable between queries, so do not render it as a
   * percentage or threshold on it in the client.
   */
  score: z.number(),
});
export type ScoredListing = z.infer<typeof scoredListingSchema>;

export const visualSearchResponseSchema = z.object({
  items: z.array(scoredListingSchema),
});
export type VisualSearchResponse = z.infer<typeof visualSearchResponseSchema>;

export const visualSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(30).default(20),
});
export type VisualSearchQuery = z.infer<typeof visualSearchQuerySchema>;

export const similarListingsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(8),
});
export type SimilarListingsQuery = z.infer<typeof similarListingsQuerySchema>;
