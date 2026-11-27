import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { getEmailConfig } from './email.config.js';

describe('EmailConfig', () => {
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: (key: string, defaultValue?: any) => defaultValue,
    };
  });

  it('should default to "local" transport in development environment', () => {
    mockConfigService.get = (key: string, defaultValue?: any) => {
      if (key === 'NODE_ENV') return 'development';
      return defaultValue;
    };

    const config = getEmailConfig(mockConfigService as ConfigService);
    expect(config.transport).toBe('local');
    expect(config.fromAddress).toBe('noreply@smart-todo.net');
    expect(config.fromName).toBe('Smart Todo');
    expect(config.aws.region).toBe('us-east-1');
  });

  it('should default to "ses" transport in production environment', () => {
    mockConfigService.get = (key: string, defaultValue?: any) => {
      if (key === 'NODE_ENV') return 'production';
      return defaultValue;
    };

    const config = getEmailConfig(mockConfigService as ConfigService);
    expect(config.transport).toBe('ses');
  });

  it('should respect explicitly configured EMAIL_TRANSPORT="ses" in development', () => {
    mockConfigService.get = (key: string, defaultValue?: any) => {
      if (key === 'NODE_ENV') return 'development';
      if (key === 'EMAIL_TRANSPORT') return 'ses';
      return defaultValue;
    };

    const config = getEmailConfig(mockConfigService as ConfigService);
    expect(config.transport).toBe('ses');
  });

  it('should respect explicitly configured EMAIL_TRANSPORT="local" in production', () => {
    mockConfigService.get = (key: string, defaultValue?: any) => {
      if (key === 'NODE_ENV') return 'production';
      if (key === 'EMAIL_TRANSPORT') return 'local';
      return defaultValue;
    };

    const config = getEmailConfig(mockConfigService as ConfigService);
    expect(config.transport).toBe('local');
  });

  it('should load AWS credentials when provided in environment', () => {
    mockConfigService.get = (key: string, defaultValue?: any) => {
      if (key === 'AWS_REGION') return 'us-west-2';
      if (key === 'AWS_ACCESS_KEY_ID') return 'AKIA_TEST_KEY';
      if (key === 'AWS_SECRET_ACCESS_KEY') return 'SECRET_TEST_KEY';
      if (key === 'EMAIL_FROM_ADDRESS') return 'custom@example.com';
      if (key === 'EMAIL_FROM_NAME') return 'Custom Sender';
      return defaultValue;
    };

    const config = getEmailConfig(mockConfigService as ConfigService);
    expect(config.fromAddress).toBe('custom@example.com');
    expect(config.fromName).toBe('Custom Sender');
    expect(config.aws.region).toBe('us-west-2');
    expect(config.aws.accessKeyId).toBe('AKIA_TEST_KEY');
    expect(config.aws.secretAccessKey).toBe('SECRET_TEST_KEY');
  });
});
