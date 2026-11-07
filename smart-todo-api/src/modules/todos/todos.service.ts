import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { MAX_TODOS_PER_LIST, ORDER_STEP } from '../../common/constants/quotas.constants.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { GetTodosQueryDto } from './dto/get-todos-query.dto.js';
import { GetAllTodosQueryDto } from './dto/get-all-todos-query.dto.js';
import { ReorderTodoDto } from './dto/reorder-todo.dto.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';
import { TodosRepository, TodoItemSummary } from './todos.repository.js';

export interface TodoResponse {
  todo: TodoItemSummary;
}

export interface PaginatedTodosResponse {
  items: TodoItemSummary[];
  hasMore: boolean;
  nextCursor: string | null;
  meta: {
    totalCount: number;
    activeCount: number;
    completedCount: number;
    quotaLimit: number;
  };
}

export interface DeleteTodoResponse {
  message: string;
  deletedId: string;
  counts: {
    totalCount: number;
    activeCount: number;
    completedCount: number;
  };
}

@Injectable()
export class TodosService {
  constructor(private readonly todosRepository: TodosRepository) {}

  async createTodo(
    userId: string,
    listId: string,
    dto: CreateTodoDto,
  ): Promise<TodoResponse> {
    const todo = await this.todosRepository.transaction(async (tx) => {
      // 1. Verify list ownership
      const list = await this.todosRepository.findListByIdAndUserId(listId, userId, tx);
      if (!list) {
        throw new NotFoundException('Todo list not found.');
      }

      // 2. Enforce max 40 items quota per list
      const totalCount = await this.todosRepository.countTotalByListId(listId, tx);
      if (totalCount >= MAX_TODOS_PER_LIST) {
        throw new UnprocessableEntityException({
          errorCode: 'TODO_QUOTA_EXCEEDED',
          error: 'TODO_QUOTA_EXCEEDED',
          message: `Demo quota reached: You can create a maximum of ${MAX_TODOS_PER_LIST} todos per list.`,
        });
      }

      // 3. Compute order_new = (minOrder ?? 2000) - 1000
      const minActiveOrder = await this.todosRepository.findMinActiveOrderByListId(listId, tx);
      const newOrder = (minActiveOrder ?? 2000) - ORDER_STEP;

      // 4. Create the item
      return this.todosRepository.create(userId, listId, dto.text.trim(), newOrder, tx);
    });

    return { todo };
  }

  async getTodos(
    userId: string,
    listId: string,
    query: GetTodosQueryDto,
  ): Promise<PaginatedTodosResponse> {
    const list = await this.todosRepository.findListByIdAndUserId(listId, userId);
    if (!list) {
      throw new NotFoundException('Todo list not found.');
    }

    const limit = query.limit ?? 20;
    const rawItems = await this.todosRepository.findTodosByCursor({
      listId,
      isCompleted: query.completed,
      query: query.query?.trim() || undefined,
      cursor: query.cursor,
      limit,
    });

    const hasMore = rawItems.length > limit;
    const items = hasMore ? rawItems.slice(0, limit) : rawItems;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    const counts = await this.todosRepository.countCountsByListId(listId);

    return {
      items,
      hasMore,
      nextCursor,
      meta: {
        totalCount: counts.totalCount,
        activeCount: counts.activeCount,
        completedCount: counts.completedCount,
        quotaLimit: MAX_TODOS_PER_LIST,
      },
    };
  }

  async getAllUserTodos(
    userId: string,
    query: GetAllTodosQueryDto,
  ): Promise<PaginatedTodosResponse> {
    const limit = query.limit ?? 20;
    const rawItems = await this.todosRepository.findAllTodosByUserId({
      userId,
      isCompleted: query.completed,
      query: query.query?.trim() || undefined,
      cursor: query.cursor,
      limit,
      starred: query.starred,
    });

    const hasMore = rawItems.length > limit;
    const items = hasMore ? rawItems.slice(0, limit) : rawItems;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    const counts = await this.todosRepository.countAllByUserId(userId, query.starred);

    return {
      items,
      hasMore,
      nextCursor,
      meta: {
        totalCount: counts.totalCount,
        activeCount: counts.activeCount,
        completedCount: counts.completedCount,
        quotaLimit: MAX_TODOS_PER_LIST * 3,
      },
    };
  }

  async updateTodo(
    userId: string,
    listId: string,
    todoId: string,
    dto: UpdateTodoDto,
  ): Promise<TodoResponse> {
    const updated = await this.todosRepository.transaction(async (tx) => {
      // 1. Verify list ownership
      const list = await this.todosRepository.findListByIdAndUserId(listId, userId, tx);
      if (!list) {
        throw new NotFoundException('Todo list not found.');
      }

      // 2. Find todo item and verify ownership & list association
      const todo = await this.todosRepository.findByIdAndUserId(todoId, userId, tx);
      if (!todo || todo.listId !== listId) {
        throw new NotFoundException('Todo item not found.');
      }

      const updateData: { text?: string; isCompleted?: boolean; order?: number } = {};

      if (dto.text !== undefined) {
        updateData.text = dto.text.trim();
      }

      if (dto.isCompleted !== undefined) {
        if (dto.isCompleted === false && todo.isCompleted === true) {
          // Uncomplete-to-Top Rule: query min order of active todos in list
          const minActiveOrder = await this.todosRepository.findMinActiveOrderByListId(listId, tx);
          updateData.order = (minActiveOrder ?? 2000) - ORDER_STEP;
          updateData.isCompleted = false;
        } else {
          updateData.isCompleted = dto.isCompleted;
        }
      }

      return this.todosRepository.update(todoId, updateData, tx);
    });

    return { todo: updated };
  }

  async reorderTodo(
    userId: string,
    listId: string,
    todoId: string,
    dto: ReorderTodoDto,
  ): Promise<TodoResponse> {
    const updated = await this.todosRepository.transaction(async (tx) => {
      // 1. Verify list ownership
      const list = await this.todosRepository.findListByIdAndUserId(listId, userId, tx);
      if (!list) {
        throw new NotFoundException('Todo list not found.');
      }

      // 2. Find todo item and verify ownership & list association
      const todo = await this.todosRepository.findByIdAndUserId(todoId, userId, tx);
      if (!todo || todo.listId !== listId) {
        throw new NotFoundException('Todo item not found.');
      }

      if (todo.isCompleted) {
        throw new BadRequestException('Cannot reorder a completed todo.');
      }

      // 3. Update the target item's order
      let updatedItem = await this.todosRepository.update(todoId, { order: dto.order }, tx);

      // 4. Precision Safety Net: check adjacent active items
      const activeTodos = await this.todosRepository.findActiveTodosByListId(listId, tx);
      let needsNormalization = false;
      for (let i = 1; i < activeTodos.length; i++) {
        if (Math.abs(activeTodos[i].order - activeTodos[i - 1].order) < 1e-9) {
          needsNormalization = true;
          break;
        }
      }

      if (needsNormalization) {
        const updates = activeTodos.map((item, index) => ({
          id: item.id,
          order: (index + 1) * ORDER_STEP,
        }));
        await this.todosRepository.batchUpdateOrders(updates, tx);
        const reloaded = updates.find((u) => u.id === todoId);
        if (reloaded) {
          updatedItem = { ...updatedItem, order: reloaded.order };
        }
      }

      return updatedItem;
    });

    return { todo: updated };
  }

  async deleteTodo(
    userId: string,
    listId: string,
    todoId: string,
  ): Promise<DeleteTodoResponse> {
    const counts = await this.todosRepository.transaction(async (tx) => {
      // 1. Verify list ownership
      const list = await this.todosRepository.findListByIdAndUserId(listId, userId, tx);
      if (!list) {
        throw new NotFoundException('Todo list not found.');
      }

      // 2. Find todo item and verify ownership & list association
      const todo = await this.todosRepository.findByIdAndUserId(todoId, userId, tx);
      if (!todo || todo.listId !== listId) {
        throw new NotFoundException('Todo item not found.');
      }

      // 3. Delete the item
      await this.todosRepository.delete(todoId, tx);

      // 4. Return updated counts
      return this.todosRepository.countCountsByListId(listId, tx);
    });

    return {
      message: 'Todo item deleted successfully.',
      deletedId: todoId,
      counts,
    };
  }
}
