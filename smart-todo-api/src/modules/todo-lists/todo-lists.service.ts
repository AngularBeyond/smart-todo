import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { MAX_LISTS_PER_USER, ORDER_STEP } from '../../common/constants/quotas.constants.js';
import { CreateTodoListDto } from './dto/create-todo-list.dto.js';
import { TodoListsRepository, TodoListSummary } from './todo-lists.repository.js';

export interface TodoListsResponse {
  lists: TodoListSummary[];
}

export interface TodoListResponse {
  list: TodoListSummary;
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

  async createList(userId: string, dto: CreateTodoListDto): Promise<TodoListResponse> {
    const list = await this.todoListsRepository.transaction(async (tx) => {
      const count = await this.todoListsRepository.countByUserId(userId, tx);
      if (count >= MAX_LISTS_PER_USER) {
        throw new UnprocessableEntityException({
          errorCode: 'LIST_QUOTA_EXCEEDED',
          error: 'LIST_QUOTA_EXCEEDED',
          message: 'Demo quota reached: You can create a maximum of 3 lists.',
        });
      }

      const maxOrder = await this.todoListsRepository.findMaxOrderByUserId(userId, tx);
      const newOrder = (maxOrder ?? 0) + ORDER_STEP;

      return this.todoListsRepository.create(userId, dto.name, newOrder, tx);
    });

    return { list };
  }
}


