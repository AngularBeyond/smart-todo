import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface VerificationTokenWithUser {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    name: string;
    isEmailVerified: boolean;
  };
}

@Injectable()
export class VerificationTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<{ id: string; userId: string; expiresAt: Date; createdAt: Date }> {
    return this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async findValidToken(tokenHash: string): Promise<VerificationTokenWithUser | null> {
    return this.prisma.emailVerificationToken.findFirst({
      where: {
        tokenHash,
        expiresAt: {
          gt: new Date(),
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
  }

  async deleteTokensByUserId(userId: string): Promise<{ count: number }> {
    return this.prisma.emailVerificationToken.deleteMany({
      where: { userId },
    });
  }

  async deleteTokenById(id: string): Promise<void> {
    await this.prisma.emailVerificationToken.delete({
      where: { id },
    });
  }

  async verifyUserEmail(userId: string, tokenId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
        },
      }),
      this.prisma.emailVerificationToken.delete({
        where: { id: tokenId },
      }),
    ]);
  }
}
