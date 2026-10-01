import type { Listing as ListingDto, ListingDetails } from '@campus-swap/shared';
import type { Prisma } from '@prisma/client';

/**
 * `savedBy` is filtered to the viewer so its presence answers "did I save
 * this?" in the same round trip, and `_count` gives the total without a
 * second query.
 */
export function listingInclude(viewerId: string) {
  return {
    photos: { orderBy: { position: 'asc' } },
    seller: true,
    savedBy: { where: { userId: viewerId }, select: { userId: true } },
    _count: { select: { savedBy: true } },
  } satisfies Prisma.ListingInclude;
}

export type ListingRow = Prisma.ListingGetPayload<{
  include: ReturnType<typeof listingInclude>;
}>;

export function toListingDto(row: ListingRow): ListingDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priceCents: row.priceCents,
    compareAtPriceCents: row.compareAtPriceCents,
    category: row.category,
    condition: row.condition,
    deliveryMethod: row.deliveryMethod,
    meetupSpot: row.meetupSpot,
    details: (row.details as ListingDetails | null) ?? null,
    status: row.status,
    photos: row.photos.map((photo) => ({
      id: photo.id,
      url: photo.url,
      thumbUrl: photo.thumbUrl,
      width: photo.width,
      height: photo.height,
      position: photo.position,
    })),
    seller: {
      id: row.seller.id,
      displayName: row.seller.displayName,
      avatarUrl: row.seller.avatarUrl,
      // Decimal is exact in the database but has no JSON representation, so it
      // crosses the wire as a number.
      ratingAvg: row.seller.ratingAvg === null ? null : Number(row.seller.ratingAvg),
      ratingCount: row.seller.ratingCount,
      createdAt: row.seller.createdAt.toISOString(),
    },
    savedByMe: row.savedBy.length > 0,
    savedCount: row._count.savedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
