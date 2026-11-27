import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service.js';
import { AwsSesTransport } from './transports/aws-ses.transport.js';
import { LocalLoggerTransport } from './transports/local-logger.transport.js';
import { EmailTemplateEngine } from './templates/email-template.engine.js';

describe('EmailService', () => {
  let service: EmailService;
  let mockConfigService: Partial<ConfigService>;
  let mockAwsSesTransport: Partial<AwsSesTransport>;
  let mockLocalLoggerTransport: Partial<LocalLoggerTransport>;
  let templateEngine: EmailTemplateEngine;
  let loggerLogSpy: any;
  let loggerErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    loggerLogSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    loggerErrorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    mockConfigService = {
      get: (key: string, defaultValue?: any) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'EMAIL_FROM_ADDRESS') return 'noreply@smart-todo.net';
        if (key === 'EMAIL_FROM_NAME') return 'Smart Todo';
        return defaultValue;
      },
    };

    mockAwsSesTransport = {
      send: vi.fn().mockResolvedValue({
        success: true,
        messageId: 'ses-123',
        attempts: 1,
        durationMs: 40,
      }),
    };

    mockLocalLoggerTransport = {
      send: vi.fn().mockResolvedValue({
        success: true,
        messageId: 'local-123',
        attempts: 1,
        durationMs: 5,
      }),
    };

    templateEngine = new EmailTemplateEngine();

    service = new EmailService(
      mockConfigService as ConfigService,
      mockAwsSesTransport as AwsSesTransport,
      mockLocalLoggerTransport as LocalLoggerTransport,
      templateEngine,
    );
  });

  it('should delegate to LocalLoggerTransport when in development mode and log telemetry', async () => {
    const result = await service.sendMail({
      to: 'test@example.com',
      subject: 'Dev Email',
      html: '<p>Dev</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('local-123');
    expect(mockLocalLoggerTransport.send).toHaveBeenCalledTimes(1);
    expect(mockAwsSesTransport.send).not.toHaveBeenCalled();

    const optionsPassed = (mockLocalLoggerTransport.send as any).mock.calls[0][0];
    expect(optionsPassed.from).toBe('Smart Todo <noreply@smart-todo.net>');

    expect(loggerLogSpy).toHaveBeenCalled();
    const telemetryLog = loggerLogSpy.mock.calls.find((call: any[]) =>
      call[0].includes('[EMAIL TELEMETRY]'),
    );
    expect(telemetryLog).toBeDefined();
    expect(telemetryLog[0]).toContain('"recipientDomain":"example.com"');
    expect(telemetryLog[0]).toContain('"event":"email_dispatched"');
  });

  it('should delegate to AwsSesTransport when transport is configured to "ses"', async () => {
    mockConfigService.get = (key: string, defaultValue?: any) => {
      if (key === 'EMAIL_TRANSPORT') return 'ses';
      if (key === 'EMAIL_FROM_ADDRESS') return 'noreply@smart-todo.net';
      if (key === 'EMAIL_FROM_NAME') return 'Smart Todo';
      return defaultValue;
    };

    const result = await service.sendMail({
      to: 'prod@company.org',
      subject: 'Prod Email',
      html: '<p>Prod</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('ses-123');
    expect(mockAwsSesTransport.send).toHaveBeenCalledTimes(1);
    expect(mockLocalLoggerTransport.send).not.toHaveBeenCalled();

    const telemetryLog = loggerLogSpy.mock.calls.find((call: any[]) =>
      call[0].includes('[EMAIL TELEMETRY]'),
    );
    expect(telemetryLog).toBeDefined();
    expect(telemetryLog[0]).toContain('"recipientDomain":"company.org"');
  });

  it('should log telemetry error when email sending fails', async () => {
    (mockLocalLoggerTransport.send as any).mockResolvedValueOnce({
      success: false,
      error: 'Simulated failure',
      errorCategory: 'BOUNCE_RISK',
      attempts: 1,
      durationMs: 10,
    });

    const result = await service.sendMail({
      to: 'invalid@badhost.com',
      subject: 'Bad Email',
      html: '<p>Fail</p>',
    });

    expect(result.success).toBe(false);
    expect(loggerErrorSpy).toHaveBeenCalled();
    const telemetryErrorLog = loggerErrorSpy.mock.calls.find((call: any[]) =>
      call[0].includes('[EMAIL TELEMETRY ERROR]'),
    );
    expect(telemetryErrorLog).toBeDefined();
    expect(telemetryErrorLog[0]).toContain('"event":"email_failed"');
    expect(telemetryErrorLog[0]).toContain('"errorCategory":"BOUNCE_RISK"');
  });

  it('should preserve explicit from address if provided in options', async () => {
    await service.sendMail({
      to: 'user@example.com',
      from: 'custom-sender@example.com',
      subject: 'Custom Sender',
      html: '<p>Hi</p>',
    });

    const optionsPassed = (mockLocalLoggerTransport.send as any).mock.calls[0][0];
    expect(optionsPassed.from).toBe('custom-sender@example.com');
  });

  it('should render and dispatch verification email', async () => {
    const result = await service.sendVerificationEmail(
      'alice@example.com',
      'Alice',
      'https://smart-todo.net/verify?token=123',
    );

    expect(result.success).toBe(true);
    expect(mockLocalLoggerTransport.send).toHaveBeenCalledTimes(1);

    const callArgs = (mockLocalLoggerTransport.send as any).mock.calls[0][0];
    expect(callArgs.to).toBe('alice@example.com');
    expect(callArgs.subject).toBe('Verify your email address - Smart Todo');
    expect(callArgs.html).toContain('Alice');
    expect(callArgs.html).toContain('https://smart-todo.net/verify?token=123');
  });

  it('should render and dispatch password reset email', async () => {
    const result = await service.sendPasswordResetEmail(
      'bob@example.com',
      'Bob',
      'https://smart-todo.net/reset?token=xyz',
      2,
    );

    expect(result.success).toBe(true);
    expect(mockLocalLoggerTransport.send).toHaveBeenCalledTimes(1);

    const callArgs = (mockLocalLoggerTransport.send as any).mock.calls[0][0];
    expect(callArgs.to).toBe('bob@example.com');
    expect(callArgs.subject).toBe('Reset your password - Smart Todo');
    expect(callArgs.html).toContain('Bob');
    expect(callArgs.html).toContain('2 hours');
  });

  it('should render and dispatch 2FA OTP email', async () => {
    const result = await service.sendOtpEmail('charlie@example.com', 'Charlie', '654321', 15);

    expect(result.success).toBe(true);
    expect(mockLocalLoggerTransport.send).toHaveBeenCalledTimes(1);

    const callArgs = (mockLocalLoggerTransport.send as any).mock.calls[0][0];
    expect(callArgs.to).toBe('charlie@example.com');
    expect(callArgs.subject).toBe('654321 is your Smart Todo verification code');
    expect(callArgs.html).toContain('654321');
    expect(callArgs.html).toContain('15 minutes');
  });
});
