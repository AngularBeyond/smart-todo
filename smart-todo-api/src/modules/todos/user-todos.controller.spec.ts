import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserTodosController } from './user-todos.controller.js';
import { TodosService, PaginatedTodosResponse } from './todos.service.js';
import type { UserPayload } from '../auth/strategies/jwt.strategy.js';

describe('UserTodosController', () => {
  let controller: UserTodosController;
  let service: {
    getAllUserTodos: ReturnType<typeof vi.fn>;
  };

  const user: UserPayload = {
    sub: 'user-123',
    email: 'test@example.com',
  };

  const mockResponse: PaginatedTodosResponse = {
    items: [
      {
        id: 'todo-1',
        listId: 'list-456',
        userId: 'user-123',
        text: 'Do laundry',
        isCompleted: false,
        order: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
        listName: 'Personal',
      },
    ],
    hasMore: false,
    nextCursor: null,
    meta: {
      totalCount: 1,
      activeCount: 1,
      completedCount: 0,
      quotaLimit: 120,
    },
  };

  beforeEach(async () => {
    service = {
      getAllUserTodos: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserTodosController],
      providers: [
        {
          provide: TodosService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<UserTodosController>(UserTodosController);
  });

  it('delegates getAllTodos to todosService.getAllUserTodos', async () => {
    service.getAllUserTodos.mockResolvedValue(mockResponse);

    const query = { completed: false, limit: 20 };
    const result = await controller.getAllTodos(user, query);

    expect(service.getAllUserTodos).toHaveBeenCalledWith('user-123', query);
    expect(result).toEqual(mockResponse);
  });
});
