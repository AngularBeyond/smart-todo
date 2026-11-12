import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TodosController } from './todos.controller.js';
import { TodosService, TodoResponse } from './todos.service.js';
import type { UserPayload } from '../auth/strategies/jwt.strategy.js';

describe('TodosController', () => {
  let controller: TodosController;
  let service: {
    createTodo: ReturnType<typeof vi.fn>;
    getTodos: ReturnType<typeof vi.fn>;
    updateTodo: ReturnType<typeof vi.fn>;
    reorderTodo: ReturnType<typeof vi.fn>;
    deleteTodo: ReturnType<typeof vi.fn>;
  };

  const user: UserPayload = {
    userId: 'user-123',
    sub: 'user-123',
    email: 'test@example.com',
  };

  const mockResponse: TodoResponse = {
    todo: {
      id: 'todo-1',
      listId: 'list-456',
      userId: 'user-123',
      text: 'Do laundry',
      isCompleted: false,
      order: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(async () => {
    service = {
      createTodo: vi.fn(),
      getTodos: vi.fn(),
      updateTodo: vi.fn(),
      reorderTodo: vi.fn(),
      deleteTodo: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodosController],
      providers: [
        {
          provide: TodosService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<TodosController>(TodosController);
  });

  describe('getTodos', () => {
    it('should delegate to TodosService with user.sub, listId, and query dto', async () => {
      const mockPaginated = {
        items: [mockResponse.todo],
        hasMore: false,
        nextCursor: null,
        meta: {
          totalCount: 1,
          activeCount: 1,
          completedCount: 0,
          quotaLimit: 40,
        },
      };
      service.getTodos.mockResolvedValue(mockPaginated);

      const query = { completed: false, limit: 20 };
      const result = await controller.getTodos(user, 'list-456', query);

      expect(service.getTodos).toHaveBeenCalledWith('user-123', 'list-456', query);
      expect(result).toEqual(mockPaginated);
    });
  });

  describe('createTodo', () => {
    it('should delegate to TodosService with user.sub, listId, and dto', async () => {
      service.createTodo.mockResolvedValue(mockResponse);

      const result = await controller.createTodo(user, 'list-456', {
        text: 'Do laundry',
      });

      expect(service.createTodo).toHaveBeenCalledWith('user-123', 'list-456', {
        text: 'Do laundry',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateTodo', () => {
    it('should delegate to TodosService with user.sub, listId, todoId, and dto', async () => {
      service.updateTodo.mockResolvedValue(mockResponse);

      const dto = { text: 'Updated task', isCompleted: true };
      const result = await controller.updateTodo(user, 'list-456', 'todo-1', dto);

      expect(service.updateTodo).toHaveBeenCalledWith('user-123', 'list-456', 'todo-1', dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('reorderTodo', () => {
    it('should delegate to TodosService with user.sub, listId, todoId, and dto', async () => {
      service.reorderTodo.mockResolvedValue(mockResponse);

      const dto = { order: 2500 };
      const result = await controller.reorderTodo(user, 'list-456', 'todo-1', dto);

      expect(service.reorderTodo).toHaveBeenCalledWith('user-123', 'list-456', 'todo-1', dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteTodo', () => {
    it('should delegate to TodosService with user.sub, listId, and todoId', async () => {
      const mockDeleteResponse = {
        message: 'Todo item deleted successfully.',
        deletedId: 'todo-1',
        counts: {
          totalCount: 3,
          activeCount: 2,
          completedCount: 1,
        },
      };
      service.deleteTodo.mockResolvedValue(mockDeleteResponse);

      const result = await controller.deleteTodo(user, 'list-456', 'todo-1');

      expect(service.deleteTodo).toHaveBeenCalledWith('user-123', 'list-456', 'todo-1');
      expect(result).toEqual(mockDeleteResponse);
    });
  });
});
