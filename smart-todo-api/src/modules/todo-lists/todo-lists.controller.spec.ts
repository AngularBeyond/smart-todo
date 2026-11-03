import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TodoListsController } from './todo-lists.controller.js';
import { TodoListsService, TodoListsResponse, TodoListResponse } from './todo-lists.service.js';
import type { UserPayload } from '../auth/strategies/jwt.strategy.js';
import { CreateTodoListDto } from './dto/create-todo-list.dto.js';

describe('TodoListsController', () => {
  let controller: TodoListsController;
  let serviceMock: {
    getLists: ReturnType<typeof vi.fn>;
    createList: ReturnType<typeof vi.fn>;
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

  const mockCreatedResponse: TodoListResponse = {
    list: {
      id: 'list-2',
      name: 'Personal Tasks',
      isStarred: false,
      order: 2000,
      createdAt: new Date('2026-01-02T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
      totalCount: 0,
      activeCount: 0,
    },
  };

  beforeEach(async () => {
    serviceMock = {
      getLists: vi.fn().mockResolvedValue(mockResponse),
      createList: vi.fn().mockResolvedValue(mockCreatedResponse),
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

  describe('createList', () => {
    it('should call service.createList with user.sub and dto', async () => {
      const dto: CreateTodoListDto = { name: 'Personal Tasks' };
      const result = await controller.createList(mockUserPayload, dto);

      expect(serviceMock.createList).toHaveBeenCalledWith('user-123', dto);
      expect(result).toEqual(mockCreatedResponse);
    });
  });
});
