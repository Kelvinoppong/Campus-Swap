import type {
  CreateListingInput,
  CursorPage,
  Listing as ListingDto,
  ListingQuery,
  UpdateListingInput,
} from '@campus-swap/shared';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';

import { toListingDto, listingInclude, type ListingRow } from './listing.mapper';

/** Page size when the client does not ask for one. */
const DEFAULT_LIMIT = 20;

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The cursor is `createdAt|id`. Ordering by a timestamp alone is not stable
   * when two listings share a millisecond, so the id breaks the tie and stops
   * a row from being skipped or repeated across pages.
   */
  private decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
    const [timestamp, id] = cursor.split('|');
    if (!timestamp || !id) return null;
    const createdAt = new Date(timestamp);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id };
  }

  private encodeCursor(row: { createdAt: Date; id: string }): string {
    return `${row.createdAt.toISOString()}|${row.id}`;
  }

  async browse(
    query: ListingQuery,
    viewer: { id: string; schoolId: string },
  ): Promise<CursorPage<ListingDto>> {
    const limit = query.limit ?? DEFAULT_LIMIT;

    // Every filter is pushed as its own clause. Several of them need `OR`
    // internally, so they cannot be merged into one flat object without
    // overwriting each other.
    const and: Prisma.ListingWhereInput[] = [
      { schoolId: viewer.schoolId, status: query.status ?? 'active' },
    ];

    if (query.category) and.push({ category: query.category });
    if (query.sellerId) and.push({ sellerId: query.sellerId });

    if (query.q) {
      and.push({
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } },
        ],
      });
    }

    if (query.freeOnly) {
      and.push({ priceCents: 0 });
    } else if (query.minPriceCents != null || query.maxPriceCents != null) {
      and.push({
        priceCents: {
          ...(query.minPriceCents != null ? { gte: query.minPriceCents } : {}),
          ...(query.maxPriceCents != null ? { lte: query.maxPriceCents } : {}),
        },
      });
    }

    // `details` is JSONB, so these filter on a path inside the document rather
    // than on a column.
    if (query.audience) {
      and.push({ details: { path: ['audience'], equals: query.audience } });
    }
    if (query.eventScope) {
      and.push({ category: 'tickets' });
      and.push({ details: { path: ['event', 'scope'], equals: query.eventScope } });
    }

    if (query.savedOnly) {
      and.push({ savedBy: { some: { userId: viewer.id } } });
    }

    // Never show a viewer listings from someone either side has blocked.
    const blocked = await this.blockedUserIds(viewer.id);
    if (blocked.length > 0) and.push({ sellerId: { notIn: blocked } });

    const cursor = query.cursor ? this.decodeCursor(query.cursor) : null;
    if (cursor) {
      and.push({
        OR: [
          { createdAt: { lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, id: { lt: cursor.id } },
        ],
      });
    }

    const where: Prisma.ListingWhereInput = { AND: and };

    // Fetch one extra row to find out whether another page exists, without a
    // second count query.
    const rows = await this.prisma.listing.findMany({
      where,
      include: listingInclude(viewer.id),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page.at(-1);

    return {
      items: page.map((row) => toListingDto(row as ListingRow)),
      nextCursor: hasMore && last ? this.encodeCursor(last) : null,
    };
  }

  async findOne(id: string, viewer: { id: string; schoolId: string }): Promise<ListingDto> {
    const row = await this.prisma.listing.findFirst({
      where: { id, schoolId: viewer.schoolId },
      include: listingInclude(viewer.id),
    });

    if (!row) throw new NotFoundException('That listing is no longer available');
    return toListingDto(row as ListingRow);
  }

  async create(
    input: CreateListingInput,
    seller: { id: string; schoolId: string },
  ): Promise<ListingDto> {
    const row = await this.prisma.listing.create({
      data: {
        sellerId: seller.id,
        schoolId: seller.schoolId,
        title: input.title,
        description: input.description,
        priceCents: input.priceCents,
        compareAtPriceCents: input.compareAtPriceCents ?? null,
        category: input.category,
        condition: input.condition,
        deliveryMethod: input.deliveryMethod,
        meetupSpot: input.meetupSpot ?? null,
        details: (input.details ?? undefined) as Prisma.InputJsonValue | undefined,
        photos: {
          create: input.photos.map((photo, position) => ({
            url: photo.storageKey,
            storageKey: photo.storageKey,
            width: photo.width,
            height: photo.height,
            position,
          })),
        },
      },
      include: listingInclude(seller.id),
    });

    return toListingDto(row as ListingRow);
  }

  async update(
    id: string,
    input: UpdateListingInput,
    viewer: { id: string; schoolId: string },
  ): Promise<ListingDto> {
    await this.assertOwner(id, viewer.id);

    const { photos, details, ...rest } = input;

    const row = await this.prisma.listing.update({
      where: { id },
      data: {
        ...rest,
        ...(details !== undefined
          ? { details: (details ?? Prisma.DbNull) as Prisma.InputJsonValue }
          : {}),
        ...(rest.status === 'sold' ? { soldAt: new Date() } : {}),
        ...(photos
          ? {
              // Replacing the set is simpler than diffing, and the position
              // unique constraint makes a partial update fiddly.
              photos: {
                deleteMany: {},
                create: photos.map((photo, position) => ({
                  url: photo.storageKey,
                  storageKey: photo.storageKey,
                  width: photo.width,
                  height: photo.height,
                  position,
                })),
              },
            }
          : {}),
      },
      include: listingInclude(viewer.id),
    });

    return toListingDto(row as ListingRow);
  }

  /** Soft delete: the row stays so existing conversations still resolve. */
  async remove(id: string, viewerId: string): Promise<void> {
    await this.assertOwner(id, viewerId);
    await this.prisma.listing.update({ where: { id }, data: { status: 'removed' } });
  }

  async setSaved(id: string, viewerId: string, saved: boolean): Promise<{ saved: boolean }> {
    if (saved) {
      await this.prisma.savedListing.upsert({
        where: { userId_listingId: { userId: viewerId, listingId: id } },
        create: { userId: viewerId, listingId: id },
        update: {},
      });
    } else {
      await this.prisma.savedListing.deleteMany({
        where: { userId: viewerId, listingId: id },
      });
    }
    return { saved };
  }

  private async assertOwner(id: string, viewerId: string): Promise<void> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!listing) throw new NotFoundException('That listing is no longer available');
    if (listing.sellerId !== viewerId) {
      throw new ForbiddenException('You can only change your own listings');
    }
  }

  /** Blocking is mutual for visibility: either direction hides the listing. */
  private async blockedUserIds(viewerId: string): Promise<string[]> {
    const blocks = await this.prisma.block.findMany({
      where: { OR: [{ ownerId: viewerId }, { targetId: viewerId }] },
      select: { ownerId: true, targetId: true },
    });

    return blocks.map((block) =>
      block.ownerId === viewerId ? block.targetId : block.ownerId,
    );
  }
}
