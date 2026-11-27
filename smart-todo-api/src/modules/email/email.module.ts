import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service.js';
import { AwsSesTransport } from './transports/aws-ses.transport.js';
import { LocalLoggerTransport } from './transports/local-logger.transport.js';
import { EmailTemplateEngine } from './templates/email-template.engine.js';

@Module({
  imports: [ConfigModule],
  providers: [
    EmailService,
    AwsSesTransport,
    LocalLoggerTransport,
    EmailTemplateEngine,
  ],
  exports: [EmailService, EmailTemplateEngine],
})
export class EmailModule {}
