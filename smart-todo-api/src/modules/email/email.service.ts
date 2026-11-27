import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailOptions } from './interfaces/email-options.interface.js';
import { EmailSendResult } from './interfaces/email-send-result.interface.js';
import { EmailTransport } from './interfaces/email-transport.interface.js';
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

    return transport.send(normalizedOptions);
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
