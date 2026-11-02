import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ProfileController } from './profile.controller.js';
import { ProfileService, ProfileResponse } from './profile.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import type { UserPayload } from '../auth/strategies/jwt.strategy.js';

describe('ProfileController', () => {
  let controller: ProfileController;
  let serviceMock: {
    getProfile: ReturnType<typeof vi.fn>;
    updateProfile: ReturnType<typeof vi.fn>;
  };

  const mockUserPayload: UserPayload = {
    userId: 'user-123',
    sub: 'user-123',
    email: 'jane@example.com',
  };

  const mockResponse: ProfileResponse = {
    profile: {
      id: 'user-123',
      name: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      preferredTheme: 'light',
      lastLoginAt: new Date('2026-01-01T00:00:00Z'),
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    },
  };

  beforeEach(async () => {
    serviceMock = {
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        { provide: ProfileService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should delegate to profileService.getProfile using user.sub', async () => {
      serviceMock.getProfile.mockResolvedValue(mockResponse);

      const result = await controller.getProfile(mockUserPayload);

      expect(serviceMock.getProfile).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateProfile', () => {
    it('should delegate to profileService.updateProfile using user.sub and dto', async () => {
      const dto: UpdateProfileDto = {
        name: 'Jane Updated',
        lastName: 'Doe Updated',
        preferredTheme: 'dark',
      };
      const updatedResponse: ProfileResponse = {
        profile: {
          ...mockResponse.profile,
          name: dto.name ?? mockResponse.profile.name,
          lastName: dto.lastName ?? mockResponse.profile.lastName,
          preferredTheme: dto.preferredTheme ?? mockResponse.profile.preferredTheme,
        },
      };
      serviceMock.updateProfile.mockResolvedValue(updatedResponse);

      const result = await controller.updateProfile(mockUserPayload, dto);

      expect(serviceMock.updateProfile).toHaveBeenCalledWith('user-123', dto);
      expect(result).toEqual(updatedResponse);
    });
  });
});
