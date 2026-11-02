import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ProfileService } from './profile.service.js';
import { ProfileRepository, UserProfileData } from './profile.repository.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

describe('ProfileService', () => {
  let service: ProfileService;
  let repositoryMock: {
    findById: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  const mockUserProfile: UserProfileData = {
    id: 'user-123',
    name: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    lastLoginAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    repositoryMock = {
      findById: vi.fn(),
      update: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: ProfileRepository, useValue: repositoryMock },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return the user profile when user exists', async () => {
      repositoryMock.findById.mockResolvedValue(mockUserProfile);

      const result = await service.getProfile('user-123');

      expect(repositoryMock.findById).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ profile: mockUserProfile });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      expect(repositoryMock.findById).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('updateProfile', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      const dto: UpdateProfileDto = { name: 'Alice' };
      await expect(service.updateProfile('non-existent', dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(repositoryMock.findById).toHaveBeenCalledWith('non-existent');
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it('should update profile fields and return updated profile', async () => {
      repositoryMock.findById.mockResolvedValue(mockUserProfile);
      const updatedProfile: UserProfileData = {
        ...mockUserProfile,
        name: 'John',
        lastName: 'Smith',
      };
      repositoryMock.update.mockResolvedValue(updatedProfile);

      const dto: UpdateProfileDto = {
        name: 'John',
        lastName: 'Smith',
      };

      const result = await service.updateProfile('user-123', dto);

      expect(repositoryMock.findById).toHaveBeenCalledWith('user-123');
      expect(repositoryMock.update).toHaveBeenCalledWith('user-123', {
        name: 'John',
        lastName: 'Smith',
      });
      expect(result).toEqual({ profile: updatedProfile });
    });

    it('should support partial updates without overriding undefined fields', async () => {
      repositoryMock.findById.mockResolvedValue(mockUserProfile);
      const updatedProfile: UserProfileData = {
        ...mockUserProfile,
        name: 'John',
      };
      repositoryMock.update.mockResolvedValue(updatedProfile);

      const dto: UpdateProfileDto = {
        name: 'John',
      };

      const result = await service.updateProfile('user-123', dto);

      expect(repositoryMock.update).toHaveBeenCalledWith('user-123', {
        name: 'John',
      });
      expect(result).toEqual({ profile: updatedProfile });
    });
  });
});
