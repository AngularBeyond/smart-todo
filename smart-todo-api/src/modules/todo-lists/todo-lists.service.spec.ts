import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TodoListsService } from './todo-lists.service.js';
import { TodoListsRepository, TodoListSummary } from './todo-lists.repository.js';

describe('TodoListsService', () => {
  let service: TodoListsService;
  let repositoryMock: {
    findAllByUserId: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    repositoryMock = {
      findAllByUserId: vi.fn(),
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
});
