import { Module } from '@nestjs/common';
import { InactiveAccountsCron } from './inactive-accounts.cron.js';

@Module({
  providers: [InactiveAccountsCron],
  exports: [InactiveAccountsCron],
})
export class MaintenanceModule {}
