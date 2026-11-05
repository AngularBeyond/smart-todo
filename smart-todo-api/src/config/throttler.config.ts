import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const getThrottlerConfig = (
  configService: ConfigService,
): ThrottlerModuleOptions => ({
  throttlers: [
    {
      name: 'default',
      ttl: Number(configService.get<number>('THROTTLE_DEFAULT_TTL', 60000)),
      limit: Number(configService.get<number>('THROTTLE_DEFAULT_LIMIT', 100)),
    },
    {
      name: 'auth',
      ttl: Number(configService.get<number>('THROTTLE_AUTH_TTL', 60000)),
      limit: Number(configService.get<number>('THROTTLE_AUTH_LIMIT', 40)),
    },
  ],
});
