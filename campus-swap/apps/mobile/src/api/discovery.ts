import type { ScoredListing } from '@campus-swap/shared';

import { apiRequest } from './client';

/**
 * Listings whose photos look like this one's. The server answers with an empty
 * list rather than an error while a listing is still waiting to be embedded,
 * so callers can treat "no results" as "hide the section".
 */
export async function fetchSimilarListings(
  listingId: string,
  limit = 8,
): Promise<ScoredListing[]> {
  const response = await apiRequest<{ items: ScoredListing[] }>(
    `/listings/${listingId}/similar?limit=${String(limit)}`,
  );
  return response.items;
}

/**
 * Search listings by describing them, e.g. "warm jacket for winter". The match
 * runs against photo embeddings, so it finds items whose titles never use those
 * words.
 */
export async function visualSearch(query: string, limit = 20): Promise<ScoredListing[]> {
  const response = await apiRequest<{ items: ScoredListing[] }>(
    `/discovery/search?q=${encodeURIComponent(query)}&limit=${String(limit)}`,
  );
  return response.items;
}
