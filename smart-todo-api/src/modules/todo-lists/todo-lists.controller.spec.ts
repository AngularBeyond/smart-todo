import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { TodoListsController } from './todo-lists.controller.js';
import { TodoListsService } from './todo-lists.service.js';

describe('TodoListsController', () => {
  let controller: TodoListsController;
  let serviceMock: Record<string, unknown>;

  beforeEach(async () => {
    serviceMock = {};

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
});
