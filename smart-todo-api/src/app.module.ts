import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor.js';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { ScheduleModule } from '@nestjs/schedule';
import { getThrottlerConfig } from './config/throttler.config.js';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ProfileModule } from './modules/profile/profile.module.js';
import { MaintenanceModule } from './modules/maintenance/maintenance.module.js';
import { TodoListsModule } from './modules/todo-lists/todo-lists.module.js';
import { TodosModule } from './modules/todos/todos.module.js';
import { EmailModule } from './modules/email/email.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getThrottlerConfig(configService),
    }),
    PrismaModule,
    AuthModule,
    ProfileModule,
    MaintenanceModule,
    TodoListsModule,
    TodosModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter,
    },
  ],
})
export class AppModule {}
