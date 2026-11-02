import { Injectable, NotFoundException } from '@nestjs/common';
import { Theme } from '@prisma/client';
import { ProfileRepository, UserProfileData } from './profile.repository.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

export interface ProfileResponse {
  profile: UserProfileData;
}

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await this.profileRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return { profile: user };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileResponse> {
    const user = await this.profileRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const updatedUser = await this.profileRepository.update(userId, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
      ...(dto.preferredTheme !== undefined ? { preferredTheme: dto.preferredTheme as Theme } : {}),
    });

    return { profile: updatedUser };
  }
}
