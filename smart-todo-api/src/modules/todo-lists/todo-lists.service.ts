import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { MAX_LISTS_PER_USER, ORDER_STEP } from '../../common/constants/quotas.constants.js';
import { CreateTodoListDto } from './dto/create-todo-list.dto.js';
import { UpdateTodoListDto } from './dto/update-todo-list.dto.js';
import { ReorderTodoListDto } from './dto/reorder-todo-list.dto.js';
import { TodoListsRepository, TodoListSummary } from './todo-lists.repository.js';

export interface TodoListsResponse {
  lists: TodoListSummary[];
}

export interface TodoListResponse {
  list: TodoListSummary;
}

export interface DeleteTodoListResponse {
  message: string;
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

  async updateList(
    userId: string,
    listId: string,
    dto: UpdateTodoListDto,
  ): Promise<TodoListResponse> {
    const existingList = await this.todoListsRepository.findByIdAndUserId(listId, userId);
    if (!existingList) {
      throw new NotFoundException('Todo list not found.');
    }

    const updated = await this.todoListsRepository.update(listId, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.isStarred !== undefined ? { isStarred: dto.isStarred } : {}),
    });

    return { list: updated };
  }

  async reorderList(
    userId: string,
    listId: string,
    dto: ReorderTodoListDto,
  ): Promise<TodoListResponse> {
    const existingList = await this.todoListsRepository.findByIdAndUserId(listId, userId);
    if (!existingList) {
      throw new NotFoundException('Todo list not found.');
    }

    if (existingList.isStarred) {
      throw new BadRequestException('Cannot reorder a starred list.');
    }

    const updated = await this.todoListsRepository.update(listId, {
      order: dto.order,
    });

    return { list: updated };
  }

  async deleteList(userId: string, listId: string): Promise<DeleteTodoListResponse> {
    const existingList = await this.todoListsRepository.findByIdAndUserId(listId, userId);
    if (!existingList) {
      throw new NotFoundException('Todo list not found.');
    }

    await this.todoListsRepository.delete(listId);

    return { message: 'Todo list deleted successfully.' };
  }
}




