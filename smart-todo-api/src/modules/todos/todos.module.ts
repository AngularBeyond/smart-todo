import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { TodosController } from './todos.controller.js';
import { UserTodosController } from './user-todos.controller.js';
import { TodosService } from './todos.service.js';
import { TodosRepository } from './todos.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [TodosController, UserTodosController],
  providers: [TodosService, TodosRepository],
  exports: [TodosService, TodosRepository],
})
export class TodosModule {}
