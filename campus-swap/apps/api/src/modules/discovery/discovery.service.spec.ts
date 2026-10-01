import { NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../../common/prisma/prisma.service';

import type { ClipService } from './clip.service';
import { DiscoveryService } from './discovery.service';

/**
 * These tests deliberately never load CLIP. The model is 90MB and its output is
 * not the interesting part here — what can actually break is the plumbing
 * around it: ranked order surviving hydration, listings the viewer should not
 * see being excluded, and a missing embedding degrading quietly.
 */
function createPrismaMock() {
  return {
    listing: { findFirst: jest.fn(), findMany: jest.fn() },
    listingPhoto: { findMany: jest.fn() },
    block: { findMany: jest.fn() },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };
}

const viewer = { id: 'viewer-1', schoolId: 'school-1' };

/** Only the fields `toListingDto` reads. */
function listingRow(id: string) {
  return {
    id,
    title: `Listing ${id}`,
    description: '',
    priceCents: 1000,
    compareAtPriceCents: null,
    category: 'other',
    condition: 'good',
    deliveryMethod: 'meetup',
    meetupSpot: null,
    details: null,
    status: 'active',
    photos: [],
    seller: {
      id: 'seller-1',
      displayName: 'Sam',
      avatarUrl: null,
      ratingAvg: null,
      ratingCount: 0,
      createdAt: new Date('2026-01-01'),
    },
    savedBy: [],
    _count: { savedBy: 0 },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
}

describe('DiscoveryService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let clip: { embedText: jest.Mock; embedImage: jest.Mock };
  let service: DiscoveryService;

  beforeEach(() => {
    prisma = createPrismaMock();
    clip = { embedText: jest.fn(), embedImage: jest.fn() };
    prisma.block.findMany.mockResolvedValue([]);
    service = new DiscoveryService(
      prisma as unknown as PrismaService,
      clip as unknown as ClipService,
    );
  });

  describe('searchByText', () => {
    it('embeds the query text and ranks listings by the returned score', async () => {
      clip.embedText.mockResolvedValue([1, 0, 0]);
      prisma.$queryRaw.mockResolvedValue([
        { listingId: 'b', score: 0.9 },
        { listingId: 'a', score: 0.4 },
      ]);
      // Returned in the opposite order, the way Postgres is free to do for `IN`.
      prisma.listing.findMany.mockResolvedValue([listingRow('a'), listingRow('b')]);

      const results = await service.searchByText('red jacket', viewer, 10);

      expect(clip.embedText).toHaveBeenCalledWith('red jacket');
      expect(results.map((result) => result.listing.id)).toEqual(['b', 'a']);
      expect(results.map((result) => result.score)).toEqual([0.9, 0.4]);
    });

    it('hydrates every listing in one query rather than one per hit', async () => {
      clip.embedText.mockResolvedValue([1, 0, 0]);
      prisma.$queryRaw.mockResolvedValue([
        { listingId: 'a', score: 0.5 },
        { listingId: 'b', score: 0.4 },
        { listingId: 'c', score: 0.3 },
      ]);
      prisma.listing.findMany.mockResolvedValue([
        listingRow('a'),
        listingRow('b'),
        listingRow('c'),
      ]);

      await service.searchByText('bike', viewer, 10);

      expect(prisma.listing.findMany).toHaveBeenCalledTimes(1);
    });

    it('drops neighbours that hydration did not return', async () => {
      clip.embedText.mockResolvedValue([1, 0, 0]);
      prisma.$queryRaw.mockResolvedValue([
        { listingId: 'a', score: 0.9 },
        { listingId: 'gone', score: 0.8 },
      ]);
      prisma.listing.findMany.mockResolvedValue([listingRow('a')]);

      const results = await service.searchByText('bike', viewer, 10);

      expect(results.map((result) => result.listing.id)).toEqual(['a']);
    });

    it('returns nothing when no photo has been embedded yet', async () => {
      clip.embedText.mockResolvedValue([1, 0, 0]);
      prisma.$queryRaw.mockResolvedValue([]);

      await expect(service.searchByText('bike', viewer, 10)).resolves.toEqual([]);
      expect(prisma.listing.findMany).not.toHaveBeenCalled();
    });

    it('passes blocked sellers into the query so their listings cannot surface', async () => {
      clip.embedText.mockResolvedValue([1, 0, 0]);
      prisma.block.findMany.mockResolvedValue([
        { ownerId: viewer.id, targetId: 'blocked-seller' },
        { ownerId: 'blocker', targetId: viewer.id },
      ]);
      prisma.$queryRaw.mockResolvedValue([]);

      await service.searchByText('bike', viewer, 10);

      const [statement] = prisma.$queryRaw.mock.calls[0] as [{ values: unknown[] }];
      // Both directions of a block hide the other person, so both ids travel.
      expect(statement.values).toContainEqual(['blocked-seller', 'blocker']);
    });
  });

  describe('similarTo', () => {
    it('uses the listing own embedding and excludes it from its own results', async () => {
      prisma.listing.findFirst.mockResolvedValue({ id: 'source' });
      prisma.$queryRaw
        .mockResolvedValueOnce([{ embedding: '[0.1,0.2,0.3]' }])
        .mockResolvedValueOnce([{ listingId: 'other', score: 0.77 }]);
      prisma.listing.findMany.mockResolvedValue([listingRow('other')]);

      const results = await service.similarTo('source', viewer, 8);

      expect(results.map((result) => result.listing.id)).toEqual(['other']);
      const [neighbourQuery] = prisma.$queryRaw.mock.calls[1] as [{ values: unknown[] }];
      expect(neighbourQuery.values).toContain('source');
      // The vector came from the stored row, not from a fresh CLIP call.
      expect(clip.embedImage).not.toHaveBeenCalled();
    });

    it('returns an empty list when the listing photos are not embedded yet', async () => {
      prisma.listing.findFirst.mockResolvedValue({ id: 'source' });
      prisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(service.similarTo('source', viewer, 8)).resolves.toEqual([]);
    });

    it('refuses a listing at another school', async () => {
      prisma.listing.findFirst.mockResolvedValue(null);

      await expect(service.similarTo('elsewhere', viewer, 8)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('embedListingPhotos', () => {
    it('only embeds photos that have no vector yet', async () => {
      prisma.listingPhoto.findMany.mockResolvedValue([
        { id: 'p1', url: 'https://cdn/1.jpg' },
      ]);
      clip.embedImage.mockResolvedValue([0.1, 0.2]);

      await expect(service.embedListingPhotos('listing-1')).resolves.toBe(1);

      const [args] = prisma.listingPhoto.findMany.mock.calls[0] as [
        { where: { embeddedAt: null } },
      ];
      expect(args.where.embeddedAt).toBeNull();
    });

    it('keeps going when one image fails to decode', async () => {
      prisma.listingPhoto.findMany.mockResolvedValue([
        { id: 'p1', url: 'https://cdn/broken.jpg' },
        { id: 'p2', url: 'https://cdn/fine.jpg' },
      ]);
      clip.embedImage
        .mockRejectedValueOnce(new Error('cannot decode'))
        .mockResolvedValueOnce([0.1, 0.2]);

      await expect(service.embedListingPhotos('listing-1')).resolves.toBe(1);
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });
});
