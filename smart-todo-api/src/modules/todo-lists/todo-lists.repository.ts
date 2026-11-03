import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
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

  async transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  async countByUserId(userId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx ?? this.prisma;
    return client.todoList.count({ where: { userId } });
  }

  async findMaxOrderByUserId(userId: string, tx?: Prisma.TransactionClient): Promise<number | null> {
    const client = tx ?? this.prisma;
    const item = await client.todoList.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return item ? item.order : null;
  }

  async create(
    userId: string,
    name: string,
    order: number,
    tx?: Prisma.TransactionClient,
  ): Promise<TodoListSummary> {
    const client = tx ?? this.prisma;
    const created = await client.todoList.create({
      data: {
        userId,
        name,
        isStarred: false,
        order,
      },
      select: {
        id: true,
        name: true,
        isStarred: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: created.id,
      name: created.name,
      isStarred: created.isStarred,
      order: created.order,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      totalCount: 0,
      activeCount: 0,
    };
  }

  async findByIdAndUserId(id: string, userId: string): Promise<TodoListSummary | null> {
    const list = await this.prisma.todoList.findFirst({
      where: { id, userId },
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

    if (!list) return null;

    return {
      id: list.id,
      name: list.name,
      isStarred: list.isStarred,
      order: list.order,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      totalCount: list.todos.length,
      activeCount: list.todos.filter((todo) => !todo.isCompleted).length,
    };
  }

  async update(
    id: string,
    data: { name?: string; isStarred?: boolean; order?: number },
  ): Promise<TodoListSummary> {
    const updated = await this.prisma.todoList.update({
      where: { id },
      data,
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

    return {
      id: updated.id,
      name: updated.name,
      isStarred: updated.isStarred,
      order: updated.order,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      totalCount: updated.todos.length,
      activeCount: updated.todos.filter((todo) => !todo.isCompleted).length,
    };
  }
}

