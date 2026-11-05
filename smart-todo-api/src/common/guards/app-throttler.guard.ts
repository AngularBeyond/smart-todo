import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  ThrottlerGuard,
  type ThrottlerModuleOptions,
  type ThrottlerRequest,
  type ThrottlerStorage,
} from '@nestjs/throttler';
import { THROTTLER_OPTIONS } from '@nestjs/throttler/dist/throttler.constants.js';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  constructor(
    @Inject(THROTTLER_OPTIONS)
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super(options, storageService, reflector);
  }

  override async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { throttler, context } = requestProps;
    let limit = requestProps.limit;
    let ttl = requestProps.ttl;

    const handlerName = context.getHandler()?.name;

    if (throttler.name === 'auth') {
      limit = Number(this.configService.get('THROTTLE_AUTH_LIMIT', 40));
      ttl = Number(this.configService.get('THROTTLE_AUTH_TTL', 60000));
    } else if (handlerName === 'refresh') {
      limit = Number(this.configService.get('THROTTLE_REFRESH_LIMIT', 20));
      ttl = Number(this.configService.get('THROTTLE_REFRESH_TTL', 60000));
    } else if (handlerName !== 'testThrottle') {
      limit = Number(this.configService.get('THROTTLE_DEFAULT_LIMIT', 100));
      ttl = Number(this.configService.get('THROTTLE_DEFAULT_TTL', 60000));
    }

    return super.handleRequest({
      ...requestProps,
      limit,
      ttl,
    });
  }
}
