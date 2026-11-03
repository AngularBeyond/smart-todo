import { Injectable } from '@nestjs/common';
import { TodoListsRepository } from './todo-lists.repository.js';

@Injectable()
export class TodoListsService {
  constructor(private readonly todoListsRepository: TodoListsRepository) {}
}
