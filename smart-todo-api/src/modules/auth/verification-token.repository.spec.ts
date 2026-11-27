import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VerificationTokenRepository } from './verification-token.repository.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('VerificationTokenRepository', () => {
  let repository: VerificationTokenRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      emailVerificationToken: {
        create: vi.fn(),
        findFirst: vi.fn(),
        deleteMany: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    repository = new VerificationTokenRepository(mockPrisma as PrismaService);
  });

  it('should create an email verification token', async () => {
    const expiresAt = new Date(Date.now() + 86400000);
    const mockCreated = {
      id: 'tok-123',
      userId: 'user-1',
      expiresAt,
      createdAt: new Date(),
    };

    mockPrisma.emailVerificationToken.create.mockResolvedValue(mockCreated);

    const result = await repository.createToken('user-1', 'hash-abc', expiresAt);

    expect(result).toEqual(mockCreated);
    expect(mockPrisma.emailVerificationToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        tokenHash: 'hash-abc',
        expiresAt,
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  });

  it('should find a valid unexpired token by hash', async () => {
    const mockToken = {
      id: 'tok-123',
      userId: 'user-1',
      tokenHash: 'hash-abc',
      expiresAt: new Date(Date.now() + 10000),
      createdAt: new Date(),
      user: {
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
        isEmailVerified: false,
      },
    };

    mockPrisma.emailVerificationToken.findFirst.mockResolvedValue(mockToken);

    const result = await repository.findValidToken('hash-abc');

    expect(result).toEqual(mockToken);
    expect(mockPrisma.emailVerificationToken.findFirst).toHaveBeenCalledWith({
      where: {
        tokenHash: 'hash-abc',
        expiresAt: {
          gt: expect.any(Date),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isEmailVerified: true,
          },
        },
      },
    });
  });

  it('should return null when token is not found or expired', async () => {
    mockPrisma.emailVerificationToken.findFirst.mockResolvedValue(null);

    const result = await repository.findValidToken('expired-hash');
    expect(result).toBeNull();
  });

  it('should delete tokens by userId', async () => {
    mockPrisma.emailVerificationToken.deleteMany.mockResolvedValue({ count: 2 });

    const result = await repository.deleteTokensByUserId('user-1');

    expect(result).toEqual({ count: 2 });
    expect(mockPrisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  it('should delete a token by its id', async () => {
    mockPrisma.emailVerificationToken.delete.mockResolvedValue({ id: 'tok-123' });

    await repository.deleteTokenById('tok-123');

    expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalledWith({
      where: { id: 'tok-123' },
    });
  });

  it('should execute transactional user verification and token cleanup', async () => {
    mockPrisma.$transaction.mockResolvedValue([{}, {}]);

    await repository.verifyUserEmail('user-1', 'tok-123');

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: expect.any(Date),
      },
    });
    expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalledWith({
      where: { id: 'tok-123' },
    });
  });
});
