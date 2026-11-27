import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailOptions } from './interfaces/email-options.interface.js';
import { EmailSendResult } from './interfaces/email-send-result.interface.js';
import { EmailTransport } from './interfaces/email-transport.interface.js';
import { EmailTelemetryEvent } from './interfaces/email-telemetry.interface.js';
import { AwsSesTransport } from './transports/aws-ses.transport.js';
import { LocalLoggerTransport } from './transports/local-logger.transport.js';
import { EmailTemplateEngine } from './templates/email-template.engine.js';
import { TransactionalTemplates } from './templates/transactional-templates.js';
import { getEmailConfig } from '../../config/email.config.js';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly defaultFromAddress: string;
  private readonly defaultFromName: string;
  private readonly templates: TransactionalTemplates;

  constructor(
    private readonly configService: ConfigService,
    private readonly awsSesTransport: AwsSesTransport,
    private readonly localLoggerTransport: LocalLoggerTransport,
    private readonly templateEngine: EmailTemplateEngine,
  ) {
    const emailConfig = getEmailConfig(this.configService);
    this.defaultFromAddress = emailConfig.fromAddress;
    this.defaultFromName = emailConfig.fromName;
    this.templates = new TransactionalTemplates(this.templateEngine);
  }

  private getActiveTransport(): EmailTransport {
    const emailConfig = getEmailConfig(this.configService);
    if (emailConfig.transport === 'ses') {
      return this.awsSesTransport;
    }
    return this.localLoggerTransport;
  }

  private extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length > 1 ? parts[1].toLowerCase() : 'unknown';
  }

  private logTelemetry(options: EmailOptions, result: EmailSendResult): void {
    const emailConfig = getEmailConfig(this.configService);
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const primaryDomain = recipients.length > 0 ? this.extractDomain(recipients[0]) : 'unknown';

    const telemetry: EmailTelemetryEvent = {
      event: result.success ? 'email_dispatched' : 'email_failed',
      transport: emailConfig.transport,
      recipientDomain: primaryDomain,
      recipientCount: recipients.length,
      subject: options.subject,
      messageId: result.messageId,
      attempts: result.attempts ?? 1,
      durationMs: result.durationMs ?? 0,
      success: result.success,
      errorCategory: result.errorCategory,
      errorMessage: result.error,
      timestamp: new Date().toISOString(),
    };

    if (result.success) {
      this.logger.log(`[EMAIL TELEMETRY] ${JSON.stringify(telemetry)}`);
    } else {
      this.logger.error(`[EMAIL TELEMETRY ERROR] ${JSON.stringify(telemetry)}`);
    }
  }

  /**
   * Dispatches a raw or pre-rendered email through the active transport.
   */
  async sendMail(options: EmailOptions): Promise<EmailSendResult> {
    const transport = this.getActiveTransport();
    const from = options.from || `${this.defaultFromName} <${this.defaultFromAddress}>`;

    const normalizedOptions: EmailOptions = {
      ...options,
      from,
    };

    const result = await transport.send(normalizedOptions);
    this.logTelemetry(normalizedOptions, result);

    return result;
  }

  /**
   * Sends a user registration verification email with CTA link.
   */
  async sendVerificationEmail(
    to: string,
    name: string,
    verifyUrl: string,
    expiresInHours?: number,
  ): Promise<EmailSendResult> {
    const rendered = this.templates.renderVerificationEmail({
      name,
      verifyUrl,
      expiresInHours,
    });

    return this.sendMail({
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }

  /**
   * Sends a password reset email with secure one-time link.
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string,
    expiresInHours?: number,
  ): Promise<EmailSendResult> {
    const rendered = this.templates.renderPasswordResetEmail({
      name,
      resetUrl,
      expiresInHours,
    });

    return this.sendMail({
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }

  /**
   * Sends a 2FA One-Time Passcode (OTP) email.
   */
  async sendOtpEmail(
    to: string,
    name: string,
    otp: string,
    expiresInMinutes?: number,
  ): Promise<EmailSendResult> {
    const rendered = this.templates.renderOtpEmail({
      name,
      otp,
      expiresInMinutes,
    });

    return this.sendMail({
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }
}
