import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface TodoListSummary {
  id: string;
  name: string;
  isStarred: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  totalCount: number;
  activeCount: number;
}

@Injectable()
export class TodoListsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUserId(userId: string): Promise<TodoListSummary[]> {
    const lists = await this.prisma.todoList.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        isStarred: true,
        order: true,
        createdAt: true,
        updatedAt: true,
        todos: {
          select: {
            isCompleted: true,
          },
        },
      },
    });

    return lists.map((list) => ({
      id: list.id,
      name: list.name,
      isStarred: list.isStarred,
      order: list.order,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      totalCount: list.todos.length,
      activeCount: list.todos.filter((todo) => !todo.isCompleted).length,
    }));
  }
}

