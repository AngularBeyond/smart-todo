import { Injectable } from '@nestjs/common';
import { TodoListsRepository, TodoListSummary } from './todo-lists.repository.js';

export interface TodoListsResponse {
  lists: TodoListSummary[];
}

@Injectable()
export class TodoListsService {
  constructor(private readonly todoListsRepository: TodoListsRepository) {}

  async getLists(userId: string): Promise<TodoListsResponse> {
    const lists = await this.todoListsRepository.findAllByUserId(userId);

    const starred = lists
      .filter((list) => list.isStarred)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const unstarred = lists
      .filter((list) => !list.isStarred)
      .sort((a, b) => a.order - b.order);

    return { lists: [...starred, ...unstarred] };
  }
}

