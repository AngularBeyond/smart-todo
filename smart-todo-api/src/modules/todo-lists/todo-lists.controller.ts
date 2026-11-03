import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TodoListsService } from './todo-lists.service.js';

@UseGuards(JwtAuthGuard)
@Controller('lists')
export class TodoListsController {
  constructor(private readonly todoListsService: TodoListsService) {}
}
