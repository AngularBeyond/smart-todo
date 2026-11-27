import { describe, it, expect, beforeEach } from 'vitest';
import { LocalLoggerTransport } from './local-logger.transport.js';

describe('LocalLoggerTransport', () => {
  let transport: LocalLoggerTransport;

  beforeEach(() => {
    transport = new LocalLoggerTransport();
  });

  it('should send a mock email successfully with single recipient', async () => {
    const result = await transport.send({
      to: 'user@example.com',
      subject: 'Test Subject',
      html: '<p>Hello world</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(result.messageId).toContain('local-');
  });

  it('should send a mock email successfully with multiple recipients', async () => {
    const result = await transport.send({
      to: ['user1@example.com', 'user2@example.com'],
      subject: 'Multi Test Subject',
      html: '<p>Hello team</p>',
      text: 'Hello team',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(result.messageId).toContain('local-');
  });
});
