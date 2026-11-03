import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { UserPayload } from '../auth/strategies/jwt.strategy.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { TodosService, TodoResponse } from './todos.service.js';

@UseGuards(JwtAuthGuard)
@Controller('lists/:listId/todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  async createTodo(
    @CurrentUser() user: UserPayload,
    @Param('listId') listId: string,
    @Body() dto: CreateTodoDto,
  ): Promise<TodoResponse> {
    return this.todosService.createTodo(user.sub, listId, dto);
  }
}
