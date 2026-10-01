import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ScoredListing } from '@campus-swap/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { listingInclude, toListingDto, type ListingRow } from '../listings/listing.mapper';
import { ClipService } from './clip.service';

/** A row of the nearest-neighbour query, before the listings are hydrated. */
interface NeighbourRow {
  listingId: string;
  score: number;
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clip: ClipService,
  ) {}

  /** pgvector reads vectors as a bracketed literal, e.g. `[0.1,-0.2]`. */
  private toVectorLiteral(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  /**
   * The shared half of both features: given a query vector, find the closest
   * listings the viewer is allowed to see.
   *
   * Photos are embedded individually and rolled up with DISTINCT ON, so a
   * listing matches on its *best* photo rather than an arbitrary cover shot —
   * the back of a jacket should still match a query for that jacket. The
   * tradeoff is that DISTINCT ON forces an exact scan instead of the HNSW
   * index; at a single school's listing count that is the right trade, and the
   * scaling path is to over-fetch neighbours first and roll up afterwards.
   */
  private async nearestListings(
    embedding: number[],
    viewer: { id: string; schoolId: string },
    limit: number,
    excludeListingId?: string,
  ): Promise<ScoredListing[]> {
    const vector = this.toVectorLiteral(embedding);
    const blocked = await this.blockedUserIds(viewer.id);
    // A sentinel keeps the SQL branch-free; no listing has the nil UUID.
    const excluded = excludeListingId ?? '00000000-0000-0000-0000-000000000000';

    const neighbours = await this.prisma.$queryRaw<NeighbourRow[]>(Prisma.sql`
      SELECT "listingId", score
      FROM (
        SELECT DISTINCT ON (p.listing_id)
               p.listing_id AS "listingId",
               1 - (p.embedding <=> ${vector}::vector) AS score
        FROM listing_photos p
        JOIN listings l ON l.id = p.listing_id
        WHERE p.embedding IS NOT NULL
          AND l.school_id = ${viewer.schoolId}::uuid
          AND l.status = 'active'
          AND l.id <> ${excluded}::uuid
          AND l.seller_id <> ALL(${blocked}::uuid[])
        ORDER BY p.listing_id, p.embedding <=> ${vector}::vector
      ) best
      ORDER BY score DESC
      LIMIT ${limit}
    `);

    if (neighbours.length === 0) return [];

    // One hydration query for the whole page, then restored to ranked order
    // because `IN` gives no ordering guarantee.
    const rows = await this.prisma.listing.findMany({
      where: { id: { in: neighbours.map((row) => row.listingId) } },
      include: listingInclude(viewer.id),
    });

    const byId = new Map(rows.map((row) => [row.id, row]));

    return neighbours.flatMap((neighbour) => {
      const row = byId.get(neighbour.listingId);
      if (!row) return [];
      return [{ listing: toListingDto(row as ListingRow), score: neighbour.score }];
    });
  }

  /** "More like this": image-to-image, driven by the listing's own photos. */
  async similarTo(
    listingId: string,
    viewer: { id: string; schoolId: string },
    limit: number,
  ): Promise<ScoredListing[]> {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, schoolId: viewer.schoolId },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const [source] = await this.prisma.$queryRaw<{ embedding: string }[]>(Prisma.sql`
      SELECT embedding::text AS embedding
      FROM listing_photos
      WHERE listing_id = ${listingId}::uuid AND embedding IS NOT NULL
      ORDER BY position ASC
      LIMIT 1
    `);

    // No embedding yet means the job has not caught up. An empty row is a
    // better answer than an error: the screen just omits the section.
    if (!source) return [];

    const embedding = JSON.parse(source.embedding) as number[];
    return this.nearestListings(embedding, viewer, limit, listingId);
  }

  /**
   * Natural-language search over photos. Because CLIP puts text and images in
   * one space, "red leather jacket" is embedded exactly like a photo would be
   * and compared directly against the index — no tags, no keyword matching, and
   * it works on listings whose title never mentions the words.
   *
   * Scores are not calibrated across queries, so results are ranked and capped
   * rather than cut at an absolute threshold.
   */
  async searchByText(
    query: string,
    viewer: { id: string; schoolId: string },
    limit: number,
  ): Promise<ScoredListing[]> {
    const embedding = await this.clip.embedText(query);
    return this.nearestListings(embedding, viewer, limit);
  }

  /**
   * Embeds any photos of a listing that do not have a vector yet. Called after
   * a listing is created and by the backfill script.
   */
  async embedListingPhotos(listingId: string): Promise<number> {
    const photos = await this.prisma.listingPhoto.findMany({
      where: { listingId, embeddedAt: null },
      select: { id: true, url: true },
      orderBy: { position: 'asc' },
    });

    let embedded = 0;
    for (const photo of photos) {
      try {
        const embedding = await this.clip.embedImage(photo.url);
        await this.prisma.$executeRaw(Prisma.sql`
          UPDATE listing_photos
          SET embedding = ${this.toVectorLiteral(embedding)}::vector,
              embedded_at = now()
          WHERE id = ${photo.id}::uuid
        `);
        embedded += 1;
      } catch (cause) {
        // A single unreadable image must not abort the rest of the batch; the
        // photo stays unembedded and is retried on the next run.
        this.logger.warn(`Could not embed photo ${photo.id}: ${String(cause)}`);
      }
    }

    return embedded;
  }

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
