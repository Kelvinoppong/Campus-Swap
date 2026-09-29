import {
  LIMITS,
  type AuthSession,
  type CurrentUser,
  type RequestCodeResponse,
} from '@campus-swap/shared';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';
import { CodesService } from './codes.service';
import { MailService } from './mail.service';
import { TokensService } from './tokens.service';

type UserWithSchool = Prisma.UserGetPayload<{ include: { school: true } }>;

/** Nest has no built-in 429, so sign-in throttling raises this. */
class TooManyRequestsException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly codes: CodesService,
    private readonly tokens: TokensService,
    private readonly mail: MailService,
  ) {}

  /**
   * Emails a one-time code. The response is identical whether or not an account
   * exists, so this endpoint cannot be used to enumerate who has signed up.
   * Only the school domain is checked, because that is public information.
   */
  async requestCode(email: string, ip: string | null): Promise<RequestCodeResponse> {
    const domain = email.split('@')[1];
    const school = domain
      ? await this.prisma.school.findUnique({ where: { emailDomain: domain } })
      : null;

    if (!school) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { email: 'Campus Swap is not at your school yet' },
      });
    }

    if (await this.codes.isRateLimited(email, ip)) {
      throw new TooManyRequestsException('Too many codes requested. Try again in an hour.');
    }

    const code = await this.codes.issue({ email, schoolId: school.id, ip });
    await this.mail.sendSignInCode(email, code);

    return { sent: true, expiresInSeconds: LIMITS.signInCodeTtlMinutes * 60 };
  }

  /** Verifies the code and creates the account on first successful sign-in. */
  async verifyCode(params: {
    email: string;
    code: string;
    pushToken?: string;
    userAgent?: string;
  }): Promise<AuthSession> {
    const result = await this.codes.verify(params.email, params.code);

    if (!result.ok) {
      if (result.reason === 'too_many_attempts') {
        throw new TooManyRequestsException('Too many wrong codes. Request a new one.');
      }
      throw new UnauthorizedException(
        result.reason === 'expired'
          ? 'That code expired. Request a new one.'
          : 'That code is not right.',
      );
    }

    const user = await this.findOrCreateUser(params.email, params.pushToken);

    if (user.status === 'suspended') {
      throw new ForbiddenException('This account is suspended');
    }

    const tokens = await this.tokens.issueForUser(user, params.userAgent);
    return { ...tokens, user: toCurrentUser(user) };
  }

  private async findOrCreateUser(email: string, pushToken?: string): Promise<UserWithSchool> {
    const existing = await this.prisma.user.findUnique({
      where: { email },
      include: { school: true },
    });

    if (existing) {
      if (pushToken && pushToken !== existing.pushToken) {
        return this.prisma.user.update({
          where: { id: existing.id },
          data: { pushToken, lastSeenAt: new Date() },
          include: { school: true },
        });
      }
      return existing;
    }

    const domain = email.split('@')[1];
    const school = await this.prisma.school.findUniqueOrThrow({
      where: { emailDomain: domain },
    });

    this.logger.log(`Creating account for ${email} at ${school.name}`);

    return this.prisma.user.create({
      data: {
        email,
        schoolId: school.id,
        displayName: defaultDisplayName(email),
        pushToken: pushToken ?? null,
        lastSeenAt: new Date(),
      },
      include: { school: true },
    });
  }

  async refresh(refreshToken: string, userAgent?: string) {
    return this.tokens.rotate(refreshToken, userAgent);
  }

  async signOut(refreshToken: string): Promise<void> {
    await this.tokens.revokeByToken(refreshToken);
  }

  async me(userId: string): Promise<CurrentUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { school: true },
    });
    return toCurrentUser(user);
  }
}

/** "jordan.miller@school.edu" -> "Jordan M." — a real name, not a handle. */
function defaultDisplayName(email: string): string {
  const localPart = email.split('@')[0] ?? 'student';
  const parts = localPart.split(/[._-]+/).filter(Boolean);
  const first = parts[0] ?? 'Student';
  const capitalised = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  const lastInitial = parts[1]?.charAt(0).toUpperCase();
  return lastInitial ? `${capitalised} ${lastInitial}.` : capitalised;
}

function toCurrentUser(user: UserWithSchool): CurrentUser {
  return {
    id: user.id,
    email: user.email,
    schoolId: user.schoolId,
    schoolName: user.school.name,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    status: user.status,
    ratingAvg: user.ratingAvg ? Number(user.ratingAvg) : null,
    ratingCount: user.ratingCount,
    createdAt: user.createdAt.toISOString(),
  };
}

export { toCurrentUser };
export type { User };
