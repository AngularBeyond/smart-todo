import { Module } from '@nestjs/common';
import { TodoListsController } from './todo-lists.controller.js';
import { TodoListsService } from './todo-lists.service.js';
import { TodoListsRepository } from './todo-lists.repository.js';

@Module({
  controllers: [TodoListsController],
  providers: [TodoListsService, TodoListsRepository],
  exports: [TodoListsService, TodoListsRepository],
})
export class TodoListsModule {}
