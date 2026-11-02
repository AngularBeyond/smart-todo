import { Injectable } from '@nestjs/common';
import { Theme } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface UserProfileData {
  id: string;
  name: string;
  lastName: string;
  email: string;
  preferredTheme: Theme;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserProfileData | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        preferredTheme: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; lastName?: string; preferredTheme?: Theme },
  ): Promise<UserProfileData> {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        preferredTheme: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
