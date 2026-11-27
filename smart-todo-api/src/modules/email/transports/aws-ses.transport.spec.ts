import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { AwsSesTransport } from './aws-ses.transport.js';

describe('AwsSesTransport', () => {
  let transport: AwsSesTransport;
  let mockConfigService: Partial<ConfigService>;
  let sendMock: any;

  beforeEach(() => {
    sendMock = vi.fn().mockResolvedValue({ MessageId: 'ses-msg-12345' });
    vi.spyOn(SESClient.prototype, 'send').mockImplementation(sendMock);

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

    transport = new AwsSesTransport(mockConfigService as ConfigService);
  });

  it('should successfully send an email with standard options', async () => {
    const result = await transport.send({
      to: 'recipient@example.com',
      subject: 'Welcome to Smart Todo',
      html: '<h1>Welcome</h1>',
      text: 'Welcome',
      replyTo: 'support@smart-todo.net',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('ses-msg-12345');
    expect(sendMock).toHaveBeenCalledTimes(1);

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
    expect(commandInstance.input.ReplyToAddresses).toBeUndefined();
  });

  it('should return failure result when SES client throws an error', async () => {
    sendMock.mockRejectedValueOnce(new Error('SES MessageRejected: Email address not verified'));

    const result = await transport.send({
      to: 'unverified@example.com',
      subject: 'Test Failure',
      html: '<p>Failed</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('SES MessageRejected');
  });
});
