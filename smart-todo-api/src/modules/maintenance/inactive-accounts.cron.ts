import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class InactiveAccountsCron {
  private readonly logger = new Logger(InactiveAccountsCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeInactiveAccounts(): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    this.logger.log(`Starting purge of inactive accounts older than ${cutoffDate.toISOString()}`);

    const result = await this.prisma.user.deleteMany({
      where: {
        lastLoginAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`Purged ${result.count} inactive accounts.`);
    return { deletedCount: result.count };
  }
}
