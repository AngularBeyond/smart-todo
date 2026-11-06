import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { UserPayload } from '../auth/strategies/jwt.strategy.js';
import { GetAllTodosQueryDto } from './dto/get-all-todos-query.dto.js';
import { TodosService, PaginatedTodosResponse } from './todos.service.js';

@UseGuards(JwtAuthGuard)
@Controller('todos')
export class UserTodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  async getAllTodos(
    @CurrentUser() user: UserPayload,
    @Query() query: GetAllTodosQueryDto,
  ): Promise<PaginatedTodosResponse> {
    return this.todosService.getAllUserTodos(user.sub, query);
  }
}
