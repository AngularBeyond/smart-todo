import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { UserPayload } from '../auth/strategies/jwt.strategy.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { GetTodosQueryDto } from './dto/get-todos-query.dto.js';
import { TodosService, TodoResponse, PaginatedTodosResponse } from './todos.service.js';

@UseGuards(JwtAuthGuard)
@Controller('lists/:listId/todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  async getTodos(
    @CurrentUser() user: UserPayload,
    @Param('listId') listId: string,
    @Query() query: GetTodosQueryDto,
  ): Promise<PaginatedTodosResponse> {
    return this.todosService.getTodos(user.sub, listId, query);
  }

  @Post()
  async createTodo(
    @CurrentUser() user: UserPayload,
    @Param('listId') listId: string,
    @Body() dto: CreateTodoDto,
  ): Promise<TodoResponse> {
    return this.todosService.createTodo(user.sub, listId, dto);
  }
}
