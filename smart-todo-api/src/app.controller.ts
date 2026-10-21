import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsNotEmpty, IsString } from 'class-validator';
import { AppService } from './app.service.js';

export class TestValidationDto {
  @IsString()
  @IsNotEmpty()
  title!: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  @Post('test-validation')
  testValidation(@Body() body: TestValidationDto): { title: string } {
    return { title: body.title };
  }

  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @Get('test-throttle')
  testThrottle(): { throttled: boolean } {
    return { throttled: false };
  }
}
