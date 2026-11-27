import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import { EmailOptions } from '../interfaces/email-options.interface.js';
import { EmailSendResult, EmailErrorCategory } from '../interfaces/email-send-result.interface.js';
import { EmailTransport } from '../interfaces/email-transport.interface.js';
import { getEmailConfig } from '../../../config/email.config.js';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  sleepFn?: (ms: number) => Promise<void>;
}

@Injectable()
export class AwsSesTransport implements EmailTransport {
  private readonly logger = new Logger(AwsSesTransport.name);
  private readonly sesClient: SESClient;
  private readonly defaultFromAddress: string;
  private readonly defaultFromName: string;
  private readonly retryOptions: Required<RetryOptions>;

  constructor(
    private readonly configService: ConfigService,
    customRetryOptions?: RetryOptions,
  ) {
    const emailConfig = getEmailConfig(this.configService);
    this.defaultFromAddress = emailConfig.fromAddress;
    this.defaultFromName = emailConfig.fromName;

    this.retryOptions = {
      maxRetries: customRetryOptions?.maxRetries ?? 3,
      initialDelayMs: customRetryOptions?.initialDelayMs ?? 150,
      maxDelayMs: customRetryOptions?.maxDelayMs ?? 2000,
      sleepFn: customRetryOptions?.sleepFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms))),
    };

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

  isThrottlingError(error: any): boolean {
    const name = error?.name;
    const statusCode = error?.$metadata?.httpStatusCode;
    return (
      name === 'LimitExceededException' ||
      name === 'TooManyRequestsException' ||
      name === 'ThrottlingException' ||
      name === 'ProvisionedThroughputExceededException' ||
      statusCode === 429
    );
  }

  categorizeError(error: any): EmailErrorCategory {
    if (this.isThrottlingError(error)) {
      return 'THROTTLED';
    }

    const name = error?.name;
    const message = error?.message || '';

    if (
      name === 'MailFromDomainNotVerifiedException' ||
      name === 'InvalidParameterValueException' ||
      name === 'AccountSendingPausedException' ||
      name === 'ConfigurationSetDoesNotExistException'
    ) {
      return 'CONFIGURATION';
    }

    if (
      name === 'MessageRejected' ||
      message.toLowerCase().includes('email address is not verified') ||
      message.toLowerCase().includes('email address not verified') ||
      message.toLowerCase().includes('suppression') ||
      message.toLowerCase().includes('blacklist')
    ) {
      return 'BOUNCE_RISK';
    }

    if (
      name === 'TimeoutError' ||
      name === 'NetworkingError' ||
      message.includes('ECONNRESET') ||
      message.includes('ETIMEDOUT') ||
      message.includes('ENOTFOUND')
    ) {
      return 'TRANSIENT_NETWORK';
    }

    return 'UNKNOWN';
  }

  async send(options: EmailOptions): Promise<EmailSendResult> {
    const startTime = Date.now();
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

    let attempt = 0;
    while (attempt <= this.retryOptions.maxRetries) {
      attempt++;
      try {
        const command = new SendEmailCommand(input);
        const response = await this.sesClient.send(command);
        const durationMs = Date.now() - startTime;

        this.logger.log(
          `[SES EMAIL DISPATCH] Sent to [${toAddresses.join(', ')}] | MessageId: ${response.MessageId} | Attempts: ${attempt} | Duration: ${durationMs}ms`,
        );

        return {
          success: true,
          messageId: response.MessageId,
          attempts: attempt,
          durationMs,
        };
      } catch (error: any) {
        const isThrottled = this.isThrottlingError(error);
        const errorCategory = this.categorizeError(error);
        const errorMessage = error?.message || 'Unknown AWS SES error';

        if (isThrottled && attempt <= this.retryOptions.maxRetries) {
          const jitter = Math.random() * 50;
          const delayMs = Math.min(
            this.retryOptions.initialDelayMs * Math.pow(2, attempt - 1) + jitter,
            this.retryOptions.maxDelayMs,
          );

          this.logger.warn(
            `[SES THROTTLED] Attempt ${attempt}/${this.retryOptions.maxRetries + 1} for [${toAddresses.join(', ')}] failed with ${error?.name}. Retrying in ${Math.round(delayMs)}ms...`,
          );

          await this.retryOptions.sleepFn(delayMs);
          continue;
        }

        const durationMs = Date.now() - startTime;
        this.logger.error(
          `[SES EMAIL ERROR] Failed sending to [${toAddresses.join(', ')}] | Category: ${errorCategory} | Error: ${errorMessage} | Attempts: ${attempt} | Duration: ${durationMs}ms`,
          error?.stack,
        );

        return {
          success: false,
          error: errorMessage,
          errorCategory,
          attempts: attempt,
          durationMs,
        };
      }
    }

    const durationMs = Date.now() - startTime;
    return {
      success: false,
      error: 'Max retries exhausted for SES delivery',
      errorCategory: 'THROTTLED',
      attempts: attempt,
      durationMs,
    };
  }
}
