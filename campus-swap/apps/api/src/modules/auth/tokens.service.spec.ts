import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';

import type { PrismaService } from '../../common/prisma/prisma.service';
import type { Env } from '../../config/env';

import { TokensService } from './tokens.service';

function createPrismaMock() {
  return {
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'new-row' }),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
}

const env = {
  JWT_ACCESS_SECRET: 'access-secret',
  ACCESS_TOKEN_TTL: '15m',
  REFRESH_TOKEN_TTL_DAYS: 30,
} as Env;

/** Only the columns TokensService reads; the rest of the row is irrelevant here. */
const user = {
  id: 'u1',
  schoolId: 's1',
  role: 'member',
  status: 'active',
} as unknown as User;

describe('TokensService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwt: { signAsync: jest.Mock };
  let service: TokensService;

  beforeEach(() => {
    prisma = createPrismaMock();
    jwt = { signAsync: jest.fn().mockResolvedValue('signed.access.token') };
    service = new TokensService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      env,
    );
  });

  describe('issueForUser', () => {
    it('signs the access token with the claims the guard reads back', async () => {
      await service.issueForUser(user);

      const [claims] = jwt.signAsync.mock.calls[0];
      expect(claims).toEqual({ sub: 'u1', schoolId: 's1', role: 'member', sid: expect.any(String) });
    });

    it('reports the access TTL in seconds, not as the raw "15m" string', async () => {
      const tokens = await service.issueForUser(user);

      expect(tokens.expiresIn).toBe(900);
      expect(jwt.signAsync.mock.calls[0][1]).toMatchObject({ expiresIn: 900 });
    });

    it('stores only a hash of the refresh token', async () => {
      const tokens = await service.issueForUser(user);

      const { tokenHash } = prisma.refreshToken.create.mock.calls[0][0].data;
      expect(tokenHash).not.toEqual(tokens.refreshToken);
      expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('starts a fresh family per device', async () => {
      const first = await service.issueForUser(user, 'iPhone');
      const second = await service.issueForUser(user, 'iPad');

      const [a, b] = prisma.refreshToken.create.mock.calls;
      expect(a[0].data.familyId).not.toEqual(b[0].data.familyId);
      expect(a[0].data.userAgent).toBe('iPhone');
      expect(first.refreshToken).not.toEqual(second.refreshToken);
    });
  });

  describe('rotate', () => {
    function liveRecord(overrides = {}) {
      return {
        id: 'row-1',
        userId: 'u1',
        familyId: 'fam-1',
        revokedAt: null,
        replacedById: null,
        expiresAt: new Date(Date.now() + 60_000),
        user,
        ...overrides,
      };
    }

    it('issues a new pair and retires the presented token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(liveRecord());

      const next = await service.rotate('old-token');

      expect(next.refreshToken).toBeTruthy();
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'row-1' },
        data: { revokedAt: expect.any(Date), replacedById: 'new-row' },
      });
    });

    it('keeps the rotated token inside the same family', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(liveRecord());

      await service.rotate('old-token');

      expect(prisma.refreshToken.create.mock.calls[0][0].data.familyId).toBe('fam-1');
    });

    it('revokes the whole family when an already-rotated token is replayed', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(
        liveRecord({ replacedById: 'row-2', revokedAt: new Date() }),
      );

      await expect(service.rotate('stolen-token')).rejects.toThrow(UnauthorizedException);

      // Both the thief and the real user get logged out; that is the point.
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { familyId: 'fam-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('rejects an unknown token without revoking anything', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.rotate('bogus')).rejects.toThrow(UnauthorizedException);
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('rejects an expired token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(
        liveRecord({ expiresAt: new Date(Date.now() - 1) }),
      );

      await expect(service.rotate('stale')).rejects.toThrow(UnauthorizedException);
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('refuses to refresh a suspended account mid-session', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(
        liveRecord({ user: { ...user, status: 'suspended' } }),
      );

      await expect(service.rotate('good-token')).rejects.toThrow('This account is suspended');
    });
  });

  describe('revokeByToken', () => {
    it('signs out only the family that presented the token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({ familyId: 'fam-9' });

      await service.revokeByToken('a-token');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { familyId: 'fam-9', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('stays quiet when the token is unknown', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.revokeByToken('bogus')).resolves.toBeUndefined();
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });
  });
});
