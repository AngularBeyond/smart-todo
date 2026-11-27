import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailOptions } from './interfaces/email-options.interface.js';
import { EmailSendResult } from './interfaces/email-send-result.interface.js';
import { EmailTransport } from './interfaces/email-transport.interface.js';
import { AwsSesTransport } from './transports/aws-ses.transport.js';
import { LocalLoggerTransport } from './transports/local-logger.transport.js';
import { getEmailConfig } from '../../config/email.config.js';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly defaultFromAddress: string;
  private readonly defaultFromName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly awsSesTransport: AwsSesTransport,
    private readonly localLoggerTransport: LocalLoggerTransport,
  ) {
    const emailConfig = getEmailConfig(this.configService);
    this.defaultFromAddress = emailConfig.fromAddress;
    this.defaultFromName = emailConfig.fromName;
  }

  private getActiveTransport(): EmailTransport {
    const emailConfig = getEmailConfig(this.configService);
    if (emailConfig.transport === 'ses') {
      return this.awsSesTransport;
    }
    return this.localLoggerTransport;
  }

  async sendMail(options: EmailOptions): Promise<EmailSendResult> {
    const transport = this.getActiveTransport();
    const from = options.from || `${this.defaultFromName} <${this.defaultFromAddress}>`;

    const normalizedOptions: EmailOptions = {
      ...options,
      from,
    };

    return transport.send(normalizedOptions);
  }
}
