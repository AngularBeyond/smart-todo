import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TodoListsController } from './todo-lists.controller.js';
import { TodoListsService, TodoListsResponse } from './todo-lists.service.js';
import type { UserPayload } from '../auth/strategies/jwt.strategy.js';

describe('TodoListsController', () => {
  let controller: TodoListsController;
  let serviceMock: {
    getLists: ReturnType<typeof vi.fn>;
  };

  const mockUserPayload: UserPayload = {
    userId: 'user-123',
    sub: 'user-123',
    email: 'user@example.com',
  };

  const mockResponse: TodoListsResponse = {
    lists: [
      {
        id: 'list-1',
        name: 'Work Tasks',
        isStarred: true,
        order: 1000,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-02T00:00:00Z'),
        totalCount: 5,
        activeCount: 3,
      },
    ],
  };

  beforeEach(async () => {
    serviceMock = {
      getLists: vi.fn().mockResolvedValue(mockResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoListsController],
      providers: [
        {
          provide: TodoListsService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<TodoListsController>(TodoListsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLists', () => {
    it('should call service.getLists with user.sub and return response', async () => {
      const result = await controller.getLists(mockUserPayload);

      expect(serviceMock.getLists).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockResponse);
    });
  });
});
