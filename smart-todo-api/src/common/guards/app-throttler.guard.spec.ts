import { describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { AppThrottlerGuard } from './app-throttler.guard.js';

describe('AppThrottlerGuard', () => {
  it('reads limits and ttls from ConfigService', async () => {
    const configMap = new Map<string, number>([
      ['THROTTLE_AUTH_LIMIT', 40],
      ['THROTTLE_AUTH_TTL', 60000],
      ['THROTTLE_REFRESH_LIMIT', 20],
      ['THROTTLE_REFRESH_TTL', 60000],
      ['THROTTLE_DEFAULT_LIMIT', 100],
      ['THROTTLE_DEFAULT_TTL', 60000],
    ]);

    const mockConfigService = {
      get: vi.fn((key: string, defaultValue: number) => configMap.get(key) ?? defaultValue),
    } as unknown as ConfigService;

    const incrementMock = vi.fn().mockResolvedValue({
      totalHits: 1,
      timeToExpire: 60000,
      isBlocked: false,
      timeToBlockExpire: 0,
    });

    const mockStorage = {
      increment: incrementMock,
    } as unknown as ThrottlerStorage;

    const mockReflector = new Reflector();

    const guard = new AppThrottlerGuard(
      {
        throttlers: [
          { name: 'default', ttl: 60000, limit: 100 },
          { name: 'auth', ttl: 60000, limit: 40 },
        ],
      },
      mockStorage,
      mockReflector,
      mockConfigService,
    );

    await guard.onModuleInit();

    const mockContext = {
      getHandler: () => ({ name: 'login' }),
      getClass: () => ({ name: 'AuthController' }),
      switchToHttp: () => ({
        getRequest: () => ({ ip: '127.0.0.1', headers: {} }),
        getResponse: () => ({ setHeader: vi.fn(), header: vi.fn() }),
      }),
    } as any;

    const canActivate = await guard.canActivate(mockContext);
    expect(canActivate).toBe(true);
    expect(incrementMock).toHaveBeenCalledWith(
      expect.any(String),
      60000,
      40,
      expect.anything(),
      'auth',
    );
  });
});
