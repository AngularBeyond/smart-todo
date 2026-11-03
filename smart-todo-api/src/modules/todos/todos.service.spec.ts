import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
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
    findTodosByCursor: ReturnType<typeof vi.fn>;
    countCountsByListId: ReturnType<typeof vi.fn>;
    findByIdAndUserId: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    findActiveTodosByListId: ReturnType<typeof vi.fn>;
    batchUpdateOrders: ReturnType<typeof vi.fn>;
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
      findTodosByCursor: vi.fn(),
      countCountsByListId: vi.fn(),
      findByIdAndUserId: vi.fn(),
      update: vi.fn(),
      findActiveTodosByListId: vi.fn(),
      batchUpdateOrders: vi.fn(),
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

  describe('getTodos', () => {
    it('should throw NotFoundException if the list does not exist or belong to user', async () => {
      repository.findListByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.getTodos(userId, listId, { completed: false, limit: 20 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should query active todos with order asc and return hasMore: false when items <= limit', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      const mockItems: TodoItemSummary[] = [
        { ...mockCreatedTodo, id: 't1', order: 100 },
        { ...mockCreatedTodo, id: 't2', order: 200 },
      ];
      repository.findTodosByCursor.mockResolvedValue(mockItems);
      repository.countCountsByListId.mockResolvedValue({
        totalCount: 2,
        activeCount: 2,
        completedCount: 0,
      });

      const result = await service.getTodos(userId, listId, { completed: false, limit: 20 });

      expect(repository.findTodosByCursor).toHaveBeenCalledWith({
        listId,
        isCompleted: false,
        cursor: undefined,
        limit: 20,
      });
      expect(result.items).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
      expect(result.meta).toEqual({
        totalCount: 2,
        activeCount: 2,
        completedCount: 0,
        quotaLimit: MAX_TODOS_PER_LIST,
      });
    });

    it('should return hasMore: true and nextCursor when items exceed limit (take: limit + 1)', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      // Generate 21 items for limit = 20
      const mockItems: TodoItemSummary[] = Array.from({ length: 21 }, (_, i) => ({
        ...mockCreatedTodo,
        id: `todo-${i + 1}`,
        order: (i + 1) * 100,
      }));
      repository.findTodosByCursor.mockResolvedValue(mockItems);
      repository.countCountsByListId.mockResolvedValue({
        totalCount: 35,
        activeCount: 35,
        completedCount: 0,
      });

      const result = await service.getTodos(userId, listId, { completed: false, limit: 20 });

      expect(result.items).toHaveLength(20);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('todo-20');
      expect(result.meta.totalCount).toBe(35);
    });

    it('should query completed todos with completed: true and pass cursor when provided', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      const mockItems: TodoItemSummary[] = [
        { ...mockCreatedTodo, id: 'comp-2', isCompleted: true },
      ];
      repository.findTodosByCursor.mockResolvedValue(mockItems);
      repository.countCountsByListId.mockResolvedValue({
        totalCount: 10,
        activeCount: 5,
        completedCount: 5,
      });

      const result = await service.getTodos(userId, listId, {
        completed: true,
        cursor: 'comp-1',
        limit: 10,
      });

      expect(repository.findTodosByCursor).toHaveBeenCalledWith({
        listId,
        isCompleted: true,
        cursor: 'comp-1',
        limit: 10,
      });
      expect(result.items).toEqual(mockItems);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
      expect(result.meta.completedCount).toBe(5);
    });
  });

  describe('updateTodo', () => {
    const todoId = 'todo-1';

    it('should throw NotFoundException if the list does not exist or belong to user', async () => {
      repository.findListByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.updateTodo(userId, listId, todoId, { text: 'Updated text' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if the todo does not exist or belong to user', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      repository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.updateTodo(userId, listId, todoId, { text: 'Updated text' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if the todo belongs to a different list', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      repository.findByIdAndUserId.mockResolvedValue({
        ...mockCreatedTodo,
        listId: 'other-list',
      });

      await expect(
        service.updateTodo(userId, listId, todoId, { text: 'Updated text' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update text with trimming and without changing order or isCompleted', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      repository.findByIdAndUserId.mockResolvedValue(mockCreatedTodo);
      repository.update.mockResolvedValue({
        ...mockCreatedTodo,
        text: 'Trimmed updated text',
      });

      const result = await service.updateTodo(userId, listId, todoId, {
        text: '   Trimmed updated text   ',
      });

      expect(repository.update).toHaveBeenCalledWith(
        todoId,
        { text: 'Trimmed updated text' },
        expect.anything(),
      );
      expect(result.todo.text).toBe('Trimmed updated text');
    });

    it('should mark todo as completed (isCompleted: true) without changing order', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      repository.findByIdAndUserId.mockResolvedValue({
        ...mockCreatedTodo,
        isCompleted: false,
      });
      repository.update.mockResolvedValue({
        ...mockCreatedTodo,
        isCompleted: true,
      });

      const result = await service.updateTodo(userId, listId, todoId, {
        isCompleted: true,
      });

      expect(repository.update).toHaveBeenCalledWith(
        todoId,
        { isCompleted: true },
        expect.anything(),
      );
      expect(result.todo.isCompleted).toBe(true);
    });

    it('should apply Uncomplete-to-Top rule when uncompleting a todo (isCompleted: true -> false)', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      repository.findByIdAndUserId.mockResolvedValue({
        ...mockCreatedTodo,
        isCompleted: true,
        order: 5000,
      });
      repository.findMinActiveOrderByListId.mockResolvedValue(500);
      repository.update.mockResolvedValue({
        ...mockCreatedTodo,
        isCompleted: false,
        order: -500,
      });

      const result = await service.updateTodo(userId, listId, todoId, {
        isCompleted: false,
      });

      // minOrder (500) - ORDER_STEP (1000) = -500
      expect(repository.update).toHaveBeenCalledWith(
        todoId,
        { isCompleted: false, order: -500 },
        expect.anything(),
      );
      expect(result.todo.order).toBe(-500);
      expect(result.todo.isCompleted).toBe(false);
    });

    it('should apply Uncomplete-to-Top with default 1000 order when no active todos exist', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      repository.findByIdAndUserId.mockResolvedValue({
        ...mockCreatedTodo,
        isCompleted: true,
      });
      repository.findMinActiveOrderByListId.mockResolvedValue(null);
      repository.update.mockResolvedValue({
        ...mockCreatedTodo,
        isCompleted: false,
        order: 1000,
      });

      const result = await service.updateTodo(userId, listId, todoId, {
        isCompleted: false,
      });

      // (null ?? 2000) - ORDER_STEP (1000) = 1000
      expect(repository.update).toHaveBeenCalledWith(
        todoId,
        { isCompleted: false, order: 1000 },
        expect.anything(),
      );
      expect(result.todo.order).toBe(1000);
    });
  });

  describe('reorderTodo', () => {
    const todoId = 'todo-1';

    it('should throw NotFoundException if the list does not exist or belong to user', async () => {
      repository.findListByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.reorderTodo(userId, listId, todoId, { order: 1500 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if the todo does not exist or belong to user', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      repository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.reorderTodo(userId, listId, todoId, { order: 1500 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if trying to reorder a completed todo', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      repository.findByIdAndUserId.mockResolvedValue({
        ...mockCreatedTodo,
        isCompleted: true,
      });

      await expect(
        service.reorderTodo(userId, listId, todoId, { order: 1500 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update active todo order without normalization when neighbor distance >= 1e-9', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      repository.findByIdAndUserId.mockResolvedValue({
        ...mockCreatedTodo,
        isCompleted: false,
        order: 1000,
      });
      repository.update.mockResolvedValue({
        ...mockCreatedTodo,
        order: 1500,
      });
      repository.findActiveTodosByListId.mockResolvedValue([
        { ...mockCreatedTodo, id: 't1', order: 1000 },
        { ...mockCreatedTodo, id: todoId, order: 1500 },
        { ...mockCreatedTodo, id: 't3', order: 2000 },
      ]);

      const result = await service.reorderTodo(userId, listId, todoId, { order: 1500 });

      expect(repository.update).toHaveBeenCalledWith(
        todoId,
        { order: 1500 },
        expect.anything(),
      );
      expect(repository.batchUpdateOrders).not.toHaveBeenCalled();
      expect(result.todo.order).toBe(1500);
    });

    it('should trigger normalization to multiples of 1000 when adjacent distance < 1e-9', async () => {
      repository.findListByIdAndUserId.mockResolvedValue({ id: listId });
      repository.findByIdAndUserId.mockResolvedValue({
        ...mockCreatedTodo,
        isCompleted: false,
        order: 1000,
      });
      repository.update.mockResolvedValue({
        ...mockCreatedTodo,
        order: 1000.0000000001,
      });
      // Adjacent items with distance 1e-10 (< 1e-9)
      repository.findActiveTodosByListId.mockResolvedValue([
        { ...mockCreatedTodo, id: 't1', order: 1000 },
        { ...mockCreatedTodo, id: todoId, order: 1000.0000000001 },
      ]);
      repository.batchUpdateOrders.mockResolvedValue(undefined);

      const result = await service.reorderTodo(userId, listId, todoId, {
        order: 1000.0000000001,
      });

      expect(repository.batchUpdateOrders).toHaveBeenCalledWith(
        [
          { id: 't1', order: 1000 },
          { id: todoId, order: 2000 },
        ],
        expect.anything(),
      );
      expect(result.todo.order).toBe(2000);
    });
  });
});
