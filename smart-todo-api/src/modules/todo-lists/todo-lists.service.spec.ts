import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TodoListsService } from './todo-lists.service.js';
import { TodoListsRepository, TodoListSummary } from './todo-lists.repository.js';
import { CreateTodoListDto } from './dto/create-todo-list.dto.js';
import { UpdateTodoListDto } from './dto/update-todo-list.dto.js';

describe('TodoListsService', () => {
  let service: TodoListsService;
  let repositoryMock: {
    findAllByUserId: ReturnType<typeof vi.fn>;
    findByIdAndUserId: ReturnType<typeof vi.fn>;
    countByUserId: ReturnType<typeof vi.fn>;
    findMaxOrderByUserId: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    repositoryMock = {
      findAllByUserId: vi.fn(),
      findByIdAndUserId: vi.fn(),
      countByUserId: vi.fn(),
      findMaxOrderByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      transaction: vi.fn().mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb({})),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoListsService,
        {
          provide: TodoListsRepository,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<TodoListsService>(TodoListsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLists', () => {
    it('should sort starred lists by updatedAt DESC and unstarred lists by order ASC', async () => {
      const mockRawLists: TodoListSummary[] = [
        {
          id: 'list-unstarred-2',
          name: 'Later Tasks',
          isStarred: false,
          order: 3000,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-01T00:00:00Z'),
          totalCount: 2,
          activeCount: 1,
        },
        {
          id: 'list-starred-1',
          name: 'Older Starred',
          isStarred: true,
          order: 1000,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-02T10:00:00Z'),
          totalCount: 10,
          activeCount: 4,
        },
        {
          id: 'list-unstarred-1',
          name: 'Urgent Tasks',
          isStarred: false,
          order: 1000,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-01T00:00:00Z'),
          totalCount: 3,
          activeCount: 2,
        },
        {
          id: 'list-starred-2',
          name: 'Newer Starred',
          isStarred: true,
          order: 2000,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-03T15:00:00Z'),
          totalCount: 4,
          activeCount: 0,
        },
      ];

      repositoryMock.findAllByUserId.mockResolvedValue(mockRawLists);

      const result = await service.getLists('user-123');

      expect(repositoryMock.findAllByUserId).toHaveBeenCalledWith('user-123');
      expect(result.lists).toHaveLength(4);

      // Starred lists first, sorted by updatedAt DESC
      expect(result.lists[0].id).toBe('list-starred-2');
      expect(result.lists[1].id).toBe('list-starred-1');

      // Unstarred lists follow, sorted by order ASC
      expect(result.lists[2].id).toBe('list-unstarred-1');
      expect(result.lists[3].id).toBe('list-unstarred-2');

      // Counts are preserved
      expect(result.lists[0].totalCount).toBe(4);
      expect(result.lists[0].activeCount).toBe(0);
      expect(result.lists[2].totalCount).toBe(3);
      expect(result.lists[2].activeCount).toBe(2);
    });

    it('should return an empty list when user has no lists', async () => {
      repositoryMock.findAllByUserId.mockResolvedValue([]);

      const result = await service.getLists('user-456');

      expect(result.lists).toEqual([]);
    });
  });

  describe('createList', () => {
    it('should assign order 1000 when user has no existing lists', async () => {
      const dto: CreateTodoListDto = { name: 'My First List' };
      repositoryMock.countByUserId.mockResolvedValue(0);
      repositoryMock.findMaxOrderByUserId.mockResolvedValue(null);
      const mockCreatedList: TodoListSummary = {
        id: 'list-1',
        name: 'My First List',
        isStarred: false,
        order: 1000,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        totalCount: 0,
        activeCount: 0,
      };
      repositoryMock.create.mockResolvedValue(mockCreatedList);

      const result = await service.createList('user-123', dto);

      expect(repositoryMock.countByUserId).toHaveBeenCalledWith('user-123', expect.anything());
      expect(repositoryMock.findMaxOrderByUserId).toHaveBeenCalledWith('user-123', expect.anything());
      expect(repositoryMock.create).toHaveBeenCalledWith('user-123', 'My First List', 1000, expect.anything());
      expect(result).toEqual({ list: mockCreatedList });
    });

    it('should assign maxOrder + 1000 when user already has lists', async () => {
      const dto: CreateTodoListDto = { name: 'Second List' };
      repositoryMock.countByUserId.mockResolvedValue(1);
      repositoryMock.findMaxOrderByUserId.mockResolvedValue(2000);
      const mockCreatedList: TodoListSummary = {
        id: 'list-2',
        name: 'Second List',
        isStarred: false,
        order: 3000,
        createdAt: new Date('2026-01-02T00:00:00Z'),
        updatedAt: new Date('2026-01-02T00:00:00Z'),
        totalCount: 0,
        activeCount: 0,
      };
      repositoryMock.create.mockResolvedValue(mockCreatedList);

      const result = await service.createList('user-123', dto);

      expect(repositoryMock.create).toHaveBeenCalledWith('user-123', 'Second List', 3000, expect.anything());
      expect(result).toEqual({ list: mockCreatedList });
    });

    it('should throw UnprocessableEntityException when user already has 3 lists', async () => {
      const dto: CreateTodoListDto = { name: 'Fourth List' };
      repositoryMock.countByUserId.mockResolvedValue(3);

      await expect(service.createList('user-123', dto)).rejects.toThrow(
        UnprocessableEntityException,
      );

      expect(repositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe('updateList', () => {
    const existingList: TodoListSummary = {
      id: 'list-1',
      name: 'Initial Name',
      isStarred: false,
      order: 1000,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      totalCount: 3,
      activeCount: 2,
    };

    it('should update name and isStarred when list exists and belongs to user', async () => {
      const dto: UpdateTodoListDto = { name: 'Renamed List', isStarred: true };
      const updatedList: TodoListSummary = {
        ...existingList,
        name: 'Renamed List',
        isStarred: true,
        updatedAt: new Date('2026-01-02T00:00:00Z'),
      };

      repositoryMock.findByIdAndUserId.mockResolvedValue(existingList);
      repositoryMock.update.mockResolvedValue(updatedList);

      const result = await service.updateList('user-123', 'list-1', dto);

      expect(repositoryMock.findByIdAndUserId).toHaveBeenCalledWith('list-1', 'user-123');
      expect(repositoryMock.update).toHaveBeenCalledWith('list-1', {
        name: 'Renamed List',
        isStarred: true,
      });
      expect(result).toEqual({ list: updatedList });
    });

    it('should throw NotFoundException when list is not found or unowned', async () => {
      const dto: UpdateTodoListDto = { name: 'Renamed List' };
      repositoryMock.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.updateList('user-123', 'non-existent', dto)).rejects.toThrow(
        NotFoundException,
      );

      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });
});
