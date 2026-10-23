import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService, AuthResult, RefreshResult } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResult> {
    return this.authService.register(dto, res);
  }

  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResult> {
    return this.authService.login(dto, res);
  }

  @UseGuards(JwtAuthGuard)
  @Get('authenticated')
  getAuthenticated(): { authenticated: boolean } {
    return { authenticated: true };
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResult> {
    const rawRefreshToken = req.cookies?.['refresh_token'];
    return this.authService.refresh(rawRefreshToken, res);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @Patch('change-password')
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResult> {
    return this.authService.changePassword(userId, dto, res);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: boolean }> {
    const rawRefreshToken = req.cookies?.['refresh_token'];
    return this.authService.logout(rawRefreshToken, res);
  }
}


