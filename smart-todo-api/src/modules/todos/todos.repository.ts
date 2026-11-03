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
}
