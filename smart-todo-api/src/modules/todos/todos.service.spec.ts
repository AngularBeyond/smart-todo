import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TodosService } from './todos.service.js';
import { TodosRepository, TodoItemSummary } from './todos.repository.js';
import { MAX_TODOS_PER_LIST, ORDER_STEP } from '../../common/constants/quotas.constants.js';

describe('TodosService', () => {
  let service: TodosService;
  let repository: {
    transaction: ReturnType<typeof vi.fn>;
    findListByIdAndUserId: ReturnType<typeof vi.fn>;
    countTotalByListId: ReturnType<typeof vi.fn>;
    findMinActiveOrderByListId: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };

  const userId = 'user-123';
  const listId = 'list-456';

  const mockCreatedTodo: TodoItemSummary = {
    id: 'todo-1',
    listId,
    userId,
    text: 'Buy groceries',
    isCompleted: false,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    repository = {
      transaction: vi.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({})),
      findListByIdAndUserId: vi.fn(),
      countTotalByListId: vi.fn(),
      findMinActiveOrderByListId: vi.fn(),
      create: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        {
          provide: TodosRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<TodosService>(TodosService);
  });

  describe('createTodo', () => {
    it('should throw NotFoundException if the list does not exist or belong to user', async () => {
      repository.findListByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.createTodo(userId, listId, { text: 'Test todo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnprocessableEntityException if list already has 40 todos (quota limit)', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      repository.countTotalByListId.mockResolvedValue(MAX_TODOS_PER_LIST);

      await expect(
        service.createTodo(userId, listId, { text: '41st todo' }),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        service.createTodo(userId, listId, { text: '41st todo' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          errorCode: 'TODO_QUOTA_EXCEEDED',
        }),
      });
    });

    it('should compute order as 1000 when there are no active todos in the list', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      repository.countTotalByListId.mockResolvedValue(0);
      repository.findMinActiveOrderByListId.mockResolvedValue(null);
      repository.create.mockResolvedValue({
        ...mockCreatedTodo,
        order: 1000,
      });

      const result = await service.createTodo(userId, listId, { text: 'First active todo' });

      // minOrder is null -> (2000) - ORDER_STEP = 1000
      expect(repository.create).toHaveBeenCalledWith(
        userId,
        listId,
        'First active todo',
        1000,
        expect.anything(),
      );
      expect(result.todo.order).toBe(1000);
    });

    it('should compute order as minOrder - 1000 placing newly created todo at top (index 0)', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      repository.countTotalByListId.mockResolvedValue(3);
      repository.findMinActiveOrderByListId.mockResolvedValue(500);
      repository.create.mockResolvedValue({
        ...mockCreatedTodo,
        order: -500,
      });

      const result = await service.createTodo(userId, listId, { text: 'New top item' });

      expect(repository.create).toHaveBeenCalledWith(
        userId,
        listId,
        'New top item',
        500 - ORDER_STEP,
        expect.anything(),
      );
      expect(result.todo.order).toBe(-500);
    });

    it('should trim text input', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      repository.countTotalByListId.mockResolvedValue(0);
      repository.findMinActiveOrderByListId.mockResolvedValue(1000);
      repository.create.mockResolvedValue(mockCreatedTodo);

      await service.createTodo(userId, listId, { text: '   Trimmed task text   ' });

      expect(repository.create).toHaveBeenCalledWith(
        userId,
        listId,
        'Trimmed task text',
        0,
        expect.anything(),
      );
    });
  });
});
