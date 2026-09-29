import { createHash, randomBytes, randomUUID } from 'node:crypto';

import type { AccessTokenClaims, AuthTokens } from '@campus-swap/shared';
import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';
import { ENV, type Env } from '../../config/env';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** Refresh tokens are high-entropy random strings, so a plain SHA-256 is enough. */
  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private accessTtlSeconds(): number {
    const ttl = this.env.ACCESS_TOKEN_TTL;
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 900;
    const value = Number(match[1]);
    const unit = match[2];
    const multiplier = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
    return value * multiplier;
  }

  /** Starts a new device session. */
  async issueForUser(user: User, userAgent?: string): Promise<AuthTokens> {
    return this.mint(user, randomUUID(), userAgent);
  }

  private async mint(user: User, familyId: string, userAgent?: string): Promise<AuthTokens> {
    const claims: AccessTokenClaims = {
      sub: user.id,
      schoolId: user.schoolId,
      role: user.role,
      sid: familyId,
    };

    const accessToken = await this.jwt.signAsync(claims, {
      secret: this.env.JWT_ACCESS_SECRET,
      expiresIn: this.accessTtlSeconds(),
    });

    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(
      Date.now() + this.env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        familyId,
        tokenHash: this.hash(refreshToken),
        expiresAt,
        userAgent: userAgent ?? null,
      },
    });

    return { accessToken, refreshToken, expiresIn: this.accessTtlSeconds() };
  }

  /**
   * Rotates a refresh token. Presenting a token that was already rotated means
   * someone is replaying a stolen one, so the entire family is revoked and both
   * the thief and the real user are forced to sign in again.
   */
  async rotate(refreshToken: string, userAgent?: string): Promise<AuthTokens> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(refreshToken) },
      include: { user: true },
    });

    if (!record) throw new UnauthorizedException('Session expired, sign in again');

    if (record.revokedAt || record.replacedById) {
      this.logger.warn(`Refresh token reuse detected for user ${record.userId}`);
      await this.revokeFamily(record.familyId);
      throw new UnauthorizedException('Session expired, sign in again');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Session expired, sign in again');
    }

    if (record.user.status === 'suspended') {
      throw new UnauthorizedException('This account is suspended');
    }

    const next = await this.mint(record.user, record.familyId, userAgent);

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: {
        revokedAt: new Date(),
        replacedById: (
          await this.prisma.refreshToken.findUniqueOrThrow({
            where: { tokenHash: this.hash(next.refreshToken) },
            select: { id: true },
          })
        ).id,
      },
    });

    return next;
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Sign-out: kills only the session that presented this token. */
  async revokeByToken(refreshToken: string): Promise<void> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(refreshToken) },
      select: { familyId: true },
    });
    if (record) await this.revokeFamily(record.familyId);
  }
}
