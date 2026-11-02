import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor.js';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { ScheduleModule } from '@nestjs/schedule';
import { throttlerConfig } from './config/throttler.config.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ProfileModule } from './modules/profile/profile.module.js';
import { MaintenanceModule } from './modules/maintenance/maintenance.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      useFactory: () => throttlerConfig,
    }),
    PrismaModule,
    AuthModule,
    ProfileModule,
    MaintenanceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
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
