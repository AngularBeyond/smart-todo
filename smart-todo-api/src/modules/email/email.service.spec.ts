import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service.js';
import { AwsSesTransport } from './transports/aws-ses.transport.js';
import { LocalLoggerTransport } from './transports/local-logger.transport.js';

describe('EmailService', () => {
  let service: EmailService;
  let mockConfigService: Partial<ConfigService>;
  let mockAwsSesTransport: Partial<AwsSesTransport>;
  let mockLocalLoggerTransport: Partial<LocalLoggerTransport>;

  beforeEach(() => {
    mockConfigService = {
      get: (key: string, defaultValue?: any) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'EMAIL_FROM_ADDRESS') return 'noreply@smart-todo.net';
        if (key === 'EMAIL_FROM_NAME') return 'Smart Todo';
        return defaultValue;
      },
    };

    mockAwsSesTransport = {
      send: vi.fn().mockResolvedValue({ success: true, messageId: 'ses-123' }),
    };

    mockLocalLoggerTransport = {
      send: vi.fn().mockResolvedValue({ success: true, messageId: 'local-123' }),
    };

    service = new EmailService(
      mockConfigService as ConfigService,
      mockAwsSesTransport as AwsSesTransport,
      mockLocalLoggerTransport as LocalLoggerTransport,
    );
  });

  it('should delegate to LocalLoggerTransport when in development mode', async () => {
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
  });

  it('should delegate to AwsSesTransport when transport is configured to "ses"', async () => {
    mockConfigService.get = (key: string, defaultValue?: any) => {
      if (key === 'EMAIL_TRANSPORT') return 'ses';
      if (key === 'EMAIL_FROM_ADDRESS') return 'noreply@smart-todo.net';
      if (key === 'EMAIL_FROM_NAME') return 'Smart Todo';
      return defaultValue;
    };

    const result = await service.sendMail({
      to: 'prod@example.com',
      subject: 'Prod Email',
      html: '<p>Prod</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('ses-123');
    expect(mockAwsSesTransport.send).toHaveBeenCalledTimes(1);
    expect(mockLocalLoggerTransport.send).not.toHaveBeenCalled();
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
});
