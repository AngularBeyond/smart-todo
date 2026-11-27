import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { AwsSesTransport } from './aws-ses.transport.js';

describe('AwsSesTransport', () => {
  let transport: AwsSesTransport;
  let mockConfigService: Partial<ConfigService>;
  let sendMock: any;
  let sleepMock: any;

  beforeEach(() => {
    sendMock = vi.fn().mockResolvedValue({ MessageId: 'ses-msg-12345' });
    vi.spyOn(SESClient.prototype, 'send').mockImplementation(sendMock);
    sleepMock = vi.fn().mockResolvedValue(undefined);

    mockConfigService = {
      get: (key: string, defaultValue?: any) => {
        if (key === 'AWS_REGION') return 'us-east-1';
        if (key === 'AWS_ACCESS_KEY_ID') return 'AKIA_KEY';
        if (key === 'AWS_SECRET_ACCESS_KEY') return 'SECRET_KEY';
        if (key === 'EMAIL_FROM_ADDRESS') return 'noreply@smart-todo.net';
        if (key === 'EMAIL_FROM_NAME') return 'Smart Todo';
        return defaultValue;
      },
    };

    transport = new AwsSesTransport(mockConfigService as ConfigService, {
      maxRetries: 3,
      initialDelayMs: 10,
      maxDelayMs: 50,
      sleepFn: sleepMock,
    });
  });

  it('should successfully send an email with standard options on first attempt', async () => {
    const result = await transport.send({
      to: 'recipient@example.com',
      subject: 'Welcome to Smart Todo',
      html: '<h1>Welcome</h1>',
      text: 'Welcome',
      replyTo: 'support@smart-todo.net',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('ses-msg-12345');
    expect(result.attempts).toBe(1);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).not.toHaveBeenCalled();

    const commandInstance = sendMock.mock.calls[0][0];
    expect(commandInstance).toBeInstanceOf(SendEmailCommand);
    expect(commandInstance.input).toEqual({
      Source: 'Smart Todo <noreply@smart-todo.net>',
      Destination: {
        ToAddresses: ['recipient@example.com'],
      },
      Message: {
        Subject: {
          Data: 'Welcome to Smart Todo',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: '<h1>Welcome</h1>',
            Charset: 'UTF-8',
          },
          Text: {
            Data: 'Welcome',
            Charset: 'UTF-8',
          },
        },
      },
      ReplyToAddresses: ['support@smart-todo.net'],
    });
  });

  it('should handle array of recipients and custom from address', async () => {
    const result = await transport.send({
      to: ['user1@example.com', 'user2@example.com'],
      from: 'custom@example.com',
      subject: 'Team Update',
      html: '<p>Update</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('ses-msg-12345');

    const commandInstance = sendMock.mock.calls[0][0];
    expect(commandInstance.input.Source).toBe('custom@example.com');
    expect(commandInstance.input.Destination.ToAddresses).toEqual([
      'user1@example.com',
      'user2@example.com',
    ]);
  });

  it('should retry on throttling error and succeed on subsequent attempt', async () => {
    const throttlingError = new Error('Daily sending quota exceeded for current second');
    throttlingError.name = 'TooManyRequestsException';

    sendMock
      .mockRejectedValueOnce(throttlingError)
      .mockResolvedValueOnce({ MessageId: 'recovered-msg-999' });

    const result = await transport.send({
      to: 'user@example.com',
      subject: 'Throttled Subject',
      html: '<p>Hello</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('recovered-msg-999');
    expect(result.attempts).toBe(2);
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledTimes(1);
  });

  it('should exhaust retries when throttling persists and return failure with THROTTLED category', async () => {
    const throttlingError = new Error('Rate limit exceeded');
    throttlingError.name = 'LimitExceededException';

    sendMock.mockRejectedValue(throttlingError);

    const result = await transport.send({
      to: 'user@example.com',
      subject: 'Always Throttled',
      html: '<p>Hello</p>',
    });

    expect(result.success).toBe(false);
    expect(result.errorCategory).toBe('THROTTLED');
    expect(result.attempts).toBe(4); // initial + 3 retries
    expect(sendMock).toHaveBeenCalledTimes(4);
    expect(sleepMock).toHaveBeenCalledTimes(3);
  });

  it('should fail immediately without retrying on non-retryable errors (BOUNCE_RISK)', async () => {
    const rejectedError = new Error('Email address is on suppression list');
    rejectedError.name = 'MessageRejected';

    sendMock.mockRejectedValueOnce(rejectedError);

    const result = await transport.send({
      to: 'bounced@example.com',
      subject: 'Rejected',
      html: '<p>Failed</p>',
    });

    expect(result.success).toBe(false);
    expect(result.errorCategory).toBe('BOUNCE_RISK');
    expect(result.attempts).toBe(1);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).not.toHaveBeenCalled();
  });

  it('should categorize configuration and network errors appropriately', () => {
    const configError = new Error('Domain not verified');
    configError.name = 'MailFromDomainNotVerifiedException';
    expect(transport.categorizeError(configError)).toBe('CONFIGURATION');

    const networkError = new Error('Connection timeout ECONNRESET');
    networkError.name = 'TimeoutError';
    expect(transport.categorizeError(networkError)).toBe('TRANSIENT_NETWORK');
  });
});
