import { Injectable, Logger } from '@nestjs/common';
import { EmailOptions } from '../interfaces/email-options.interface.js';
import { EmailSendResult } from '../interfaces/email-send-result.interface.js';
import { EmailTransport } from '../interfaces/email-transport.interface.js';

@Injectable()
export class LocalLoggerTransport implements EmailTransport {
  private readonly logger = new Logger(LocalLoggerTransport.name);

  async send(options: EmailOptions): Promise<EmailSendResult> {
    const startTime = Date.now();
    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const messageId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    this.logger.log(
      `[MOCK EMAIL DISPATCH] MessageId: ${messageId} | To: ${recipients} | Subject: "${options.subject}"`,
    );
    this.logger.debug(`[MOCK EMAIL CONTENT] HTML Body: ${options.html.substring(0, 200)}...`);

    return {
      success: true,
      messageId,
      attempts: 1,
      durationMs: Date.now() - startTime,
    };
  }
}
