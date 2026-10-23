import { describe, expect, it, vi } from 'vitest';
import { InactiveAccountsCron } from './inactive-accounts.cron.js';

describe('InactiveAccountsCron', () => {
  it('should delete users with lastLoginAt older than 90 days', async () => {
    const prismaMock: any = {
      user: {
        deleteMany: vi.fn().mockResolvedValue({ count: 3 }),
      },
    };

    const cron = new InactiveAccountsCron(prismaMock);
    const beforeCall = Date.now();
    const result = await cron.purgeInactiveAccounts();
    const afterCall = Date.now();

    expect(result).toEqual({ deletedCount: 3 });
    expect(prismaMock.user.deleteMany).toHaveBeenCalled();

    const callArg = prismaMock.user.deleteMany.mock.calls[0][0];
    const cutoffDate: Date = callArg.where.lastLoginAt.lt;

    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    expect(cutoffDate.getTime()).toBeLessThanOrEqual(afterCall - ninetyDaysMs);
    expect(cutoffDate.getTime()).toBeGreaterThanOrEqual(beforeCall - ninetyDaysMs);
  });
});
