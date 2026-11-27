import { describe, it, expect, beforeEach } from 'vitest';
import { EmailTemplateEngine } from './email-template.engine.js';
import { TransactionalTemplates } from './transactional-templates.js';

describe('TransactionalTemplates', () => {
  let engine: EmailTemplateEngine;
  let templates: TransactionalTemplates;

  beforeEach(() => {
    engine = new EmailTemplateEngine();
    templates = new TransactionalTemplates(engine);
  });

  describe('renderVerificationEmail', () => {
    it('should generate verification email with custom recipient name and CTA link', () => {
      const result = templates.renderVerificationEmail({
        name: 'Alice',
        verifyUrl: 'https://smart-todo.net/verify?token=verify-123',
        expiresInHours: 24,
      });

      expect(result.subject).toBe('Verify your email address - Smart Todo');
      expect(result.html).toContain('Hi Alice,');
      expect(result.html).toContain('https://smart-todo.net/verify?token=verify-123');
      expect(result.html).toContain('Verify Email Address');
      expect(result.html).toContain('24 hours');
      expect(result.text).toContain('Hi Alice,');
      expect(result.text).toContain('https://smart-todo.net/verify?token=verify-123');
    });

    it('should sanitize user name against HTML injection', () => {
      const result = templates.renderVerificationEmail({
        name: '<script>alert("hacked")</script>',
        verifyUrl: 'https://smart-todo.net/verify',
      });

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;');
    });
  });

  describe('renderPasswordResetEmail', () => {
    it('should generate password reset email with secure URL and expiration warning', () => {
      const result = templates.renderPasswordResetEmail({
        name: 'Bob',
        resetUrl: 'https://smart-todo.net/reset-password?token=reset-456',
        expiresInHours: 1,
      });

      expect(result.subject).toBe('Reset your password - Smart Todo');
      expect(result.html).toContain('Hi Bob,');
      expect(result.html).toContain('https://smart-todo.net/reset-password?token=reset-456');
      expect(result.html).toContain('Reset My Password');
      expect(result.html).toContain('1 hour');
      expect(result.text).toContain('Password Reset Request');
      expect(result.text).toContain('https://smart-todo.net/reset-password?token=reset-456');
    });
  });

  describe('renderOtpEmail', () => {
    it('should generate 2FA OTP email with 6-digit code and expiration', () => {
      const result = templates.renderOtpEmail({
        name: 'Charlie',
        otp: '849201',
        expiresInMinutes: 10,
      });

      expect(result.subject).toBe('849201 is your Smart Todo verification code');
      expect(result.html).toContain('Hi Charlie,');
      expect(result.html).toContain('849201');
      expect(result.html).toContain('10 minutes');
      expect(result.text).toContain('Your single-use login code is: 849201');
      expect(result.text).toContain('10 minutes');
    });
  });
});
