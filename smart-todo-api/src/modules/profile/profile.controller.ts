import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ProfileService, ProfileResponse } from './profile.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import type { UserPayload } from '../auth/strategies/jwt.strategy.js';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@CurrentUser() user: UserPayload): Promise<ProfileResponse> {
    return this.profileService.getProfile(user.sub);
  }

  @Patch()
  async updateProfile(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    return this.profileService.updateProfile(user.sub, dto);
  }
}
