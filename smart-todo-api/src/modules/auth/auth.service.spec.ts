import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: any;
  let jwtMock: any;
  let configMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    jwtMock = {
      signAsync: vi.fn().mockResolvedValue('mock-access-token'),
    };

    configMock = {
      get: vi.fn().mockReturnValue('development'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ConflictException if email is already taken', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing-id' });
    const resMock: any = { cookie: vi.fn() };

    await expect(
      service.register(
        {
          name: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'password123',
        },
        resMock,
      ),
    ).rejects.toThrow(ConflictException);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('should register a new user and return tokens & user profile', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const mockUser = {
      id: 'new-user-id',
      name: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    };

    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      const txMock = {
        user: { create: vi.fn().mockResolvedValue(mockUser) },
        todoList: { create: vi.fn().mockResolvedValue({ id: 'list-1', name: 'My Tasks' }) },
        todoItem: { createMany: vi.fn().mockResolvedValue({ count: 5 }) },
        refreshToken: { create: vi.fn().mockResolvedValue({ id: 'rt-1' }) },
      };
      return callback(txMock);
    });

    const cookieSpy = vi.fn();
    const resMock: any = { cookie: cookieSpy };

    const result = await service.register(
      {
        name: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      },
      resMock,
    );

    expect(result.accessToken).toBe('mock-access-token');
    expect(result.user).toEqual(mockUser);
    expect(cookieSpy).toHaveBeenCalledWith(
      'refresh_token',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        path: '/api/v1/auth',
      }),
    );
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const resMock: any = { cookie: vi.fn() };

      await expect(
        service.login({ email: 'unknown@example.com', password: 'password123' }, resMock),
      ).rejects.toThrow();
    });

    it('should login user, update lastLoginAt, set cookie and return tokens', async () => {
      const mockPasswordHash = await import('argon2').then((m) => m.hash('password123'));
      const mockUser = {
        id: 'user-1',
        name: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        passwordHash: mockPasswordHash,
      };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          user: { update: vi.fn().mockResolvedValue(mockUser) },
          refreshToken: { create: vi.fn().mockResolvedValue({ id: 'rt-2' }) },
        };
        return callback(txMock);
      });

      const cookieSpy = vi.fn();
      const resMock: any = { cookie: cookieSpy };

      const result = await service.login(
        { email: 'jane@example.com', password: 'password123' },
        resMock,
      );

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.user.email).toBe('jane@example.com');
      expect(cookieSpy).toHaveBeenCalledWith('refresh_token', expect.any(String), expect.any(Object));
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException if refresh token is missing', async () => {
      const resMock: any = { cookie: vi.fn(), clearCookie: vi.fn() };
      await expect(service.refresh(undefined, resMock)).rejects.toThrow();
    });

    it('should rotate refresh token and return new access token', async () => {
      const storedToken = {
        id: 'stored-rt-id',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100000),
        user: { id: 'user-1', email: 'jane@example.com' },
      };
      prismaMock.refreshToken = {
        findUnique: vi.fn().mockResolvedValue(storedToken),
      };
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          refreshToken: {
            update: vi.fn().mockResolvedValue({}),
            create: vi.fn().mockResolvedValue({}),
          },
          user: {
            update: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const cookieSpy = vi.fn();
      const resMock: any = { cookie: cookieSpy };

      const result = await service.refresh('raw-token-string', resMock);
      expect(result.accessToken).toBe('mock-access-token');
      expect(cookieSpy).toHaveBeenCalledWith('refresh_token', expect.any(String), expect.any(Object));
    });
  });

  describe('changePassword', () => {
    it('should throw BadRequestException if current password does not match', async () => {
      const mockPasswordHash = await import('argon2').then((m) => m.hash('correctpassword'));
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: mockPasswordHash,
      });

      const resMock: any = { cookie: vi.fn() };
      await expect(
        service.changePassword(
          'user-1',
          { currentPassword: 'wrongpassword', newPassword: 'newsecurepass' },
          resMock,
        ),
      ).rejects.toThrow();
    });

    it('should update password hash, revoke tokens, set cookie, and return new access token', async () => {
      const mockPasswordHash = await import('argon2').then((m) => m.hash('currentpass'));
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: mockPasswordHash,
      };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          user: { update: vi.fn().mockResolvedValue(mockUser) },
          refreshToken: {
            updateMany: vi.fn().mockResolvedValue({ count: 2 }),
            create: vi.fn().mockResolvedValue({ id: 'rt-new' }),
          },
        };
        return callback(txMock);
      });

      const cookieSpy = vi.fn();
      const resMock: any = { cookie: cookieSpy };

      const result = await service.changePassword(
        'user-1',
        { currentPassword: 'currentpass', newPassword: 'newpassword123' },
        resMock,
      );

      expect(result.accessToken).toBe('mock-access-token');
      expect(cookieSpy).toHaveBeenCalledWith('refresh_token', expect.any(String), expect.any(Object));
    });
  });

  describe('logout', () => {
    it('should revoke refresh token and clear cookie', async () => {
      prismaMock.refreshToken = {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      };
      const clearSpy = vi.fn();
      const resMock: any = { clearCookie: clearSpy };

      const result = await service.logout('raw-token', resMock);
      expect(result).toEqual({ success: true });
      expect(clearSpy).toHaveBeenCalledWith('refresh_token', expect.any(Object));
      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalled();
    });
  });
});


