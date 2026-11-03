import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface TodoItemSummary {
  id: string;
  listId: string;
  userId: string;
  text: string;
  isCompleted: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TodosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  async findListByIdAndUserId(
    listId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string } | null> {
    const client = tx ?? this.prisma;
    return client.todoList.findFirst({
      where: { id: listId, userId },
      select: { id: true },
    });
  }

  async countTotalByListId(listId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx ?? this.prisma;
    return client.todoItem.count({
      where: { listId },
    });
  }

  async findMinActiveOrderByListId(
    listId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number | null> {
    const client = tx ?? this.prisma;
    const agg = await client.todoItem.aggregate({
      where: { listId, isCompleted: false },
      _min: { order: true },
    });
    return agg._min.order;
  }

  async create(
    userId: string,
    listId: string,
    text: string,
    order: number,
    tx?: Prisma.TransactionClient,
  ): Promise<TodoItemSummary> {
    const client = tx ?? this.prisma;
    return client.todoItem.create({
      data: {
        userId,
        listId,
        text,
        isCompleted: false,
        order,
      },
      select: {
        id: true,
        listId: true,
        userId: true,
        text: true,
        isCompleted: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findTodosByCursor(params: {
    listId: string;
    isCompleted: boolean;
    cursor?: string;
    limit: number;
    tx?: Prisma.TransactionClient;
  }): Promise<TodoItemSummary[]> {
    const client = params.tx ?? this.prisma;
    return client.todoItem.findMany({
      where: {
        listId: params.listId,
        isCompleted: params.isCompleted,
      },
      orderBy: params.isCompleted
        ? [{ updatedAt: 'desc' }, { id: 'desc' }]
        : [{ order: 'asc' }, { id: 'asc' }],
      take: params.limit + 1,
      ...(params.cursor
        ? {
            cursor: { id: params.cursor },
            skip: 1,
          }
        : {}),
      select: {
        id: true,
        listId: true,
        userId: true,
        text: true,
        isCompleted: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async countCountsByListId(
    listId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ totalCount: number; activeCount: number; completedCount: number }> {
    const client = tx ?? this.prisma;
    const [totalCount, activeCount] = await Promise.all([
      client.todoItem.count({ where: { listId } }),
      client.todoItem.count({ where: { listId, isCompleted: false } }),
    ]);
    return {
      totalCount,
      activeCount,
      completedCount: totalCount - activeCount,
    };
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<TodoItemSummary | null> {
    const client = tx ?? this.prisma;
    return client.todoItem.findFirst({
      where: { id, userId },
      select: {
        id: true,
        listId: true,
        userId: true,
        text: true,
        isCompleted: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(
    id: string,
    data: Prisma.TodoItemUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<TodoItemSummary> {
    const client = tx ?? this.prisma;
    return client.todoItem.update({
      where: { id },
      data,
      select: {
        id: true,
        listId: true,
        userId: true,
        text: true,
        isCompleted: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findActiveTodosByListId(
    listId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<TodoItemSummary[]> {
    const client = tx ?? this.prisma;
    return client.todoItem.findMany({
      where: { listId, isCompleted: false },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        listId: true,
        userId: true,
        text: true,
        isCompleted: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async batchUpdateOrders(
    updates: Array<{ id: string; order: number }>,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await Promise.all(
      updates.map((u) =>
        client.todoItem.update({
          where: { id: u.id },
          data: { order: u.order },
        }),
      ),
    );
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.todoItem.delete({
      where: { id },
    });
  }
}
