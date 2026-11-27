import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import { EmailOptions } from '../interfaces/email-options.interface.js';
import { EmailSendResult } from '../interfaces/email-send-result.interface.js';
import { EmailTransport } from '../interfaces/email-transport.interface.js';
import { getEmailConfig } from '../../../config/email.config.js';

@Injectable()
export class AwsSesTransport implements EmailTransport {
  private readonly logger = new Logger(AwsSesTransport.name);
  private readonly sesClient: SESClient;
  private readonly defaultFromAddress: string;
  private readonly defaultFromName: string;

  constructor(private readonly configService: ConfigService) {
    const emailConfig = getEmailConfig(this.configService);
    this.defaultFromAddress = emailConfig.fromAddress;
    this.defaultFromName = emailConfig.fromName;

    const clientConfig: { region: string; credentials?: { accessKeyId: string; secretAccessKey: string } } = {
      region: emailConfig.aws.region,
    };

    if (emailConfig.aws.accessKeyId && emailConfig.aws.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: emailConfig.aws.accessKeyId,
        secretAccessKey: emailConfig.aws.secretAccessKey,
      };
    }

    this.sesClient = new SESClient(clientConfig);
  }

  async send(options: EmailOptions): Promise<EmailSendResult> {
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
    const from = options.from || `${this.defaultFromName} <${this.defaultFromAddress}>`;

    const input: SendEmailCommandInput = {
      Source: from,
      Destination: {
        ToAddresses: toAddresses,
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: options.html,
            Charset: 'UTF-8',
          },
          ...(options.text
            ? {
                Text: {
                  Data: options.text,
                  Charset: 'UTF-8',
                },
              }
            : {}),
        },
      },
      ...(options.replyTo ? { ReplyToAddresses: [options.replyTo] } : {}),
    };

    try {
      const command = new SendEmailCommand(input);
      const response = await this.sesClient.send(command);
      this.logger.log(`[SES EMAIL DISPATCH] Sent to [${toAddresses.join(', ')}] | MessageId: ${response.MessageId}`);

      return {
        success: true,
        messageId: response.MessageId,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown AWS SES error';
      this.logger.error(
        `[SES EMAIL ERROR] Failed sending to [${toAddresses.join(', ')}] | Error: ${errorMessage}`,
        error?.stack,
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
