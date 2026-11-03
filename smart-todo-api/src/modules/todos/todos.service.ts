import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { MAX_TODOS_PER_LIST, ORDER_STEP } from '../../common/constants/quotas.constants.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { TodosRepository, TodoItemSummary } from './todos.repository.js';

export interface TodoResponse {
  todo: TodoItemSummary;
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
}
