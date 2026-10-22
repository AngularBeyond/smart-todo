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
      preferredTheme: 'light',
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
        path: '/v1/auth',
      }),
    );
  });
});
