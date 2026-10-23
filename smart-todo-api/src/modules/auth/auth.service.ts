import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'crypto';
import type { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

export interface UserResponse {
  id: string;
  name: string;
  lastName: string;
  email: string;
  preferredTheme: string;
}

export interface AuthResult {
  accessToken: string;
  user: UserResponse;
}

export interface RefreshResult {
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, res: Response): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await argon2.hash(dto.password);
    const rawRefreshToken = randomBytes(40).toString('hex');
    const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: dto.name,
          lastName: dto.lastName,
          email: dto.email,
          passwordHash,
          preferredTheme: 'light',
          lastLoginAt: new Date(),
        },
      });

      const defaultList = await tx.todoList.create({
        data: {
          userId: newUser.id,
          name: 'My Tasks',
          isStarred: false,
          order: 1000,
        },
      });

      await tx.todoItem.createMany({
        data: [
          {
            listId: defaultList.id,
            userId: newUser.id,
            text: 'Welcome! Click or tap on any task text to edit it inline.',
            isCompleted: false,
            order: 1000,
          },
          {
            listId: defaultList.id,
            userId: newUser.id,
            text: 'Use the drag handle on the left to reorder your active tasks.',
            isCompleted: false,
            order: 2000,
          },
          {
            listId: defaultList.id,
            userId: newUser.id,
            text: 'Create a new list in the sidebar or star your favorite list to pin it to the top.',
            isCompleted: false,
            order: 3000,
          },
          {
            listId: defaultList.id,
            userId: newUser.id,
            text: 'Click the list title at the top of this page to rename or delete the list.',
            isCompleted: false,
            order: 4000,
          },
          {
            listId: defaultList.id,
            userId: newUser.id,
            text: 'Create your Smart TODO account.',
            isCompleted: true,
            order: 5000,
          },
        ],
      });

      await tx.refreshToken.create({
        data: {
          userId: newUser.id,
          tokenHash,
          expiresAt,
        },
      });

      return newUser;
    });

    this.setRefreshTokenCookie(res, rawRefreshToken);

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        preferredTheme: user.preferredTheme,
      },
    };
  }

  async login(dto: LoginDto, res: Response): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const rawRefreshToken = randomBytes(40).toString('hex');
    const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });
    });

    this.setRefreshTokenCookie(res, rawRefreshToken);

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        preferredTheme: user.preferredTheme,
      },
    };
  }

  async refresh(rawRefreshToken: string | undefined, res: Response): Promise<RefreshResult> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      this.clearRefreshTokenCookie(res);
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    const newRawRefreshToken = randomBytes(40).toString('hex');
    const newTokenHash = createHash('sha256').update(newRawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      await tx.refreshToken.create({
        data: {
          userId: storedToken.userId,
          tokenHash: newTokenHash,
          expiresAt,
        },
      });

      await tx.user.update({
        where: { id: storedToken.userId },
        data: { lastLoginAt: new Date() },
      });
    });

    this.setRefreshTokenCookie(res, newRawRefreshToken);

    const payload = { sub: storedToken.user.id, email: storedToken.user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }

  private setRefreshTokenCookie(res: Response, rawRefreshToken: string): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie('refresh_token', rawRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/v1/auth',
    });
  }
}
