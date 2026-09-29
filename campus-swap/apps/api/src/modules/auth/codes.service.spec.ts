import { LIMITS } from '@campus-swap/shared';

import type { PrismaService } from '../../common/prisma/prisma.service';
import type { Env } from '../../config/env';

import { CodesService } from './codes.service';

type SignInCodeRow = {
  id: string;
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
};

/**
 * The service only ever touches `prisma.signInCode`, so the mock stays narrow
 * on purpose: a wider fake would hide the day a new table sneaks in.
 */
function createPrismaMock() {
  return {
    signInCode: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(async (ops: unknown[]) => Promise.all(ops)),
  };
}

const env = { SIGN_IN_CODE_PEPPER: 'pepper-for-tests' } as Env;

describe('CodesService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: CodesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new CodesService(prisma as unknown as PrismaService, env);
  });

  describe('issue', () => {
    it('returns a zero-padded code of the configured length', async () => {
      const code = await service.issue({ email: 'a@school.edu', schoolId: 's1', ip: null });

      expect(code).toHaveLength(LIMITS.signInCodeLength);
      expect(code).toMatch(/^\d+$/);
    });

    it('never stores the code in the clear', async () => {
      const code = await service.issue({ email: 'a@school.edu', schoolId: 's1', ip: null });

      const { codeHash } = prisma.signInCode.create.mock.calls[0][0].data;
      expect(codeHash).not.toContain(code);
      expect(codeHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('consumes outstanding codes so only one is ever live', async () => {
      await service.issue({ email: 'a@school.edu', schoolId: 's1', ip: null });

      expect(prisma.signInCode.updateMany).toHaveBeenCalledWith({
        where: { email: 'a@school.edu', consumedAt: null },
        data: { consumedAt: expect.any(Date) },
      });
      // Both statements must land together, or a crash could leave zero valid codes.
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('derives a different hash per email, so codes are not interchangeable', async () => {
      const shared = new CodesService(prisma as unknown as PrismaService, env);
      await shared.issue({ email: 'a@school.edu', schoolId: 's1', ip: null });
      await shared.issue({ email: 'b@school.edu', schoolId: 's1', ip: null });

      const [first, second] = prisma.signInCode.create.mock.calls;
      expect(first[0].data.codeHash).not.toEqual(second[0].data.codeHash);
    });
  });

  describe('verify', () => {
    /** Runs a real issue() so the stored hash is produced the same way production makes it. */
    async function issueAndStub(overrides: Partial<SignInCodeRow> = {}) {
      const code = await service.issue({ email: 'a@school.edu', schoolId: 's1', ip: null });
      const { codeHash } = prisma.signInCode.create.mock.calls[0][0].data;

      const row: SignInCodeRow = {
        id: 'code-1',
        email: 'a@school.edu',
        codeHash,
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 0,
        consumedAt: null,
        ...overrides,
      };
      prisma.signInCode.findFirst.mockResolvedValue(row);
      return { code, row };
    }

    it('accepts the code it just issued and consumes it', async () => {
      const { code } = await issueAndStub();

      await expect(service.verify('a@school.edu', code)).resolves.toEqual({ ok: true });
      expect(prisma.signInCode.update).toHaveBeenCalledWith({
        where: { id: 'code-1' },
        data: { consumedAt: expect.any(Date) },
      });
    });

    it('reports no_code when nothing is outstanding', async () => {
      prisma.signInCode.findFirst.mockResolvedValue(null);

      await expect(service.verify('a@school.edu', '123456')).resolves.toEqual({
        ok: false,
        reason: 'no_code',
      });
    });

    it('rejects and consumes an expired code', async () => {
      const { code } = await issueAndStub({ expiresAt: new Date(Date.now() - 1) });

      await expect(service.verify('a@school.edu', code)).resolves.toEqual({
        ok: false,
        reason: 'expired',
      });
      // Burning it prevents a late-but-correct guess from being replayed.
      expect(prisma.signInCode.update).toHaveBeenCalledWith({
        where: { id: 'code-1' },
        data: { consumedAt: expect.any(Date) },
      });
    });

    it('burns an attempt on a wrong guess', async () => {
      const { code } = await issueAndStub();
      const wrong = code === '000000' ? '111111' : '000000';

      await expect(service.verify('a@school.edu', wrong)).resolves.toEqual({
        ok: false,
        reason: 'wrong_code',
      });
      expect(prisma.signInCode.update).toHaveBeenCalledWith({
        where: { id: 'code-1' },
        data: { attempts: { increment: 1 } },
      });
    });

    it('stops accepting guesses once the attempt budget is spent', async () => {
      const { code } = await issueAndStub({ attempts: LIMITS.signInCodeMaxAttempts });

      // Even the *correct* code is refused, which is what caps brute force.
      await expect(service.verify('a@school.edu', code)).resolves.toEqual({
        ok: false,
        reason: 'too_many_attempts',
      });
      expect(prisma.signInCode.update).not.toHaveBeenCalled();
    });

    it('does not accept another address\u2019 code', async () => {
      const { code } = await issueAndStub();

      await expect(service.verify('b@school.edu', code)).resolves.toEqual({
        ok: false,
        reason: 'wrong_code',
      });
    });
  });

  describe('isRateLimited', () => {
    it('passes a request that is under both budgets', async () => {
      prisma.signInCode.count.mockResolvedValue(1);

      await expect(service.isRateLimited('a@school.edu', '10.0.0.1')).resolves.toBe(false);
    });

    it('blocks once one address has asked five times in an hour', async () => {
      prisma.signInCode.count.mockResolvedValueOnce(5).mockResolvedValueOnce(0);

      await expect(service.isRateLimited('a@school.edu', '10.0.0.1')).resolves.toBe(true);
    });

    it('blocks a single IP spraying many addresses', async () => {
      prisma.signInCode.count.mockResolvedValueOnce(0).mockResolvedValueOnce(20);

      await expect(service.isRateLimited('a@school.edu', '10.0.0.1')).resolves.toBe(true);
    });

    it('skips the IP budget when the address is unknown', async () => {
      prisma.signInCode.count.mockResolvedValue(0);

      await expect(service.isRateLimited('a@school.edu', null)).resolves.toBe(false);
      expect(prisma.signInCode.count).toHaveBeenCalledTimes(1);
    });
  });
});
