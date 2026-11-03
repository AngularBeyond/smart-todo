import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { TodoListsService } from './todo-lists.service.js';
import { TodoListsRepository } from './todo-lists.repository.js';

describe('TodoListsService', () => {
  let service: TodoListsService;
  let repositoryMock: Record<string, unknown>;

  beforeEach(async () => {
    repositoryMock = {};

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
});
