import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { UserPayload } from '../auth/strategies/jwt.strategy.js';
import { TodoListsService, TodoListsResponse } from './todo-lists.service.js';

@UseGuards(JwtAuthGuard)
@Controller('lists')
export class TodoListsController {
  constructor(private readonly todoListsService: TodoListsService) {}

  @Get()
  async getLists(@CurrentUser() user: UserPayload): Promise<TodoListsResponse> {
    return this.todoListsService.getLists(user.sub);
  }
}

