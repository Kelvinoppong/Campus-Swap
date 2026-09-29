import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

import { LIMITS } from '@campus-swap/shared';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { ENV, type Env } from '../../config/env';

/** How many codes one address, or one IP, may request per hour. */
const MAX_CODES_PER_EMAIL_PER_HOUR = 5;
const MAX_CODES_PER_IP_PER_HOUR = 20;

export type VerifyFailure =
  | 'no_code'
  | 'expired'
  | 'too_many_attempts'
  | 'wrong_code';

export type VerifyResult = { ok: true } | { ok: false; reason: VerifyFailure };

@Injectable()
export class CodesService {
  private readonly logger = new Logger(CodesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /**
   * A 6-digit code is only ~20 bits, so it is never stored in the clear and
   * never compared with `===`. The HMAC pepper lives in the environment, which
   * means a stolen database dump alone cannot be brute-forced offline.
   */
  private hash(email: string, code: string): string {
    return createHmac('sha256', this.env.SIGN_IN_CODE_PEPPER)
      .update(`${email}:${code}`)
      .digest('hex');
  }

  async isRateLimited(email: string, ip: string | null): Promise<boolean> {
    const since = new Date(Date.now() - 60 * 60 * 1000);

    const [byEmail, byIp] = await Promise.all([
      this.prisma.signInCode.count({ where: { email, createdAt: { gte: since } } }),
      ip
        ? this.prisma.signInCode.count({ where: { requestIp: ip, createdAt: { gte: since } } })
        : Promise.resolve(0),
    ]);

    return byEmail >= MAX_CODES_PER_EMAIL_PER_HOUR || byIp >= MAX_CODES_PER_IP_PER_HOUR;
  }

  /**
   * Issues a fresh code and invalidates any outstanding ones, so a second
   * "resend" tap cannot leave two valid codes in flight.
   */
  async issue(params: { email: string; schoolId: string; ip: string | null }): Promise<string> {
    const code = randomInt(0, 10 ** LIMITS.signInCodeLength)
      .toString()
      .padStart(LIMITS.signInCodeLength, '0');

    const expiresAt = new Date(Date.now() + LIMITS.signInCodeTtlMinutes * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.signInCode.updateMany({
        where: { email: params.email, consumedAt: null },
        data: { consumedAt: new Date() },
      }),
      this.prisma.signInCode.create({
        data: {
          email: params.email,
          schoolId: params.schoolId,
          codeHash: this.hash(params.email, code),
          expiresAt,
          requestIp: params.ip,
        },
      }),
    ]);

    return code;
  }

  /**
   * Consumes a code. Every wrong guess burns one of the five attempts on that
   * row, so an attacker gets five tries per issued code, not five per minute.
   */
  async verify(email: string, code: string): Promise<VerifyResult> {
    const record = await this.prisma.signInCode.findFirst({
      where: { email, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) return { ok: false, reason: 'no_code' };

    if (record.expiresAt.getTime() < Date.now()) {
      await this.prisma.signInCode.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      });
      return { ok: false, reason: 'expired' };
    }

    if (record.attempts >= LIMITS.signInCodeMaxAttempts) {
      return { ok: false, reason: 'too_many_attempts' };
    }

    const expected = Buffer.from(record.codeHash, 'hex');
    const actual = Buffer.from(this.hash(email, code), 'hex');
    const matches = expected.length === actual.length && timingSafeEqual(expected, actual);

    if (!matches) {
      await this.prisma.signInCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      return { ok: false, reason: 'wrong_code' };
    }

    await this.prisma.signInCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });

    return { ok: true };
  }

  /** Housekeeping for a scheduled job: expired codes are dead weight. */
  async pruneExpired(): Promise<number> {
    const { count } = await this.prisma.signInCode.deleteMany({
      where: { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
    if (count > 0) this.logger.log(`Pruned ${count} expired sign-in codes`);
    return count;
  }
}
