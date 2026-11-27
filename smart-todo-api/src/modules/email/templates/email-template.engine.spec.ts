import { describe, it, expect, beforeEach } from 'vitest';
import { EmailTemplateEngine } from './email-template.engine.js';

describe('EmailTemplateEngine', () => {
  let engine: EmailTemplateEngine;

  beforeEach(() => {
    engine = new EmailTemplateEngine();
  });

  describe('escapeHtml', () => {
    it('should escape dangerous HTML characters to prevent XSS injection', () => {
      const malicious = `<script>alert("xss & 'attack'")</script>`;
      const escaped = engine.escapeHtml(malicious);

      expect(escaped).toBe('&lt;script&gt;alert(&quot;xss &amp; &#039;attack&#039;&quot;)&lt;/script&gt;');
      expect(escaped).not.toContain('<script>');
    });

    it('should return an empty string for null, undefined, or empty input', () => {
      expect(engine.escapeHtml('')).toBe('');
      expect(engine.escapeHtml(null as unknown as string)).toBe('');
      expect(engine.escapeHtml(undefined as unknown as string)).toBe('');
    });
  });

  describe('renderBaseLayout', () => {
    it('should wrap content in a responsive HTML container with branding', () => {
      const html = engine.renderBaseLayout({
        title: 'Verify Your Account',
        preheader: 'Please verify your email address',
        content: '<p>Hello Marco</p>',
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<title>Verify Your Account</title>');
      expect(html).toContain('Please verify your email address');
      expect(html).toContain('Smart Todo');
      expect(html).toContain('Your tasks, orchestrated by agents.');
      expect(html).toContain('<p>Hello Marco</p>');
      expect(html).toContain('All rights reserved.');
    });

    it('should omit preheader span if not provided', () => {
      const html = engine.renderBaseLayout({
        title: 'Notification',
        content: '<p>Content</p>',
      });

      expect(html).not.toContain('style="display:none;font-size:0px');
    });
  });

  describe('renderCtaButton', () => {
    it('should render a styled CTA button and secondary copy-paste link', () => {
      const buttonHtml = engine.renderCtaButton({
        text: 'Confirm Email',
        url: 'https://smart-todo.net/verify?token=abc',
        secondaryNote: 'Or copy and paste this link in your browser:',
      });

      expect(buttonHtml).toContain('Confirm Email');
      expect(buttonHtml).toContain('https://smart-todo.net/verify?token=abc');
      expect(buttonHtml).toContain('Or copy and paste this link in your browser:');
      expect(buttonHtml).toContain('bgcolor="#2563eb"');
    });

    it('should omit secondary copy-paste link if not specified', () => {
      const buttonHtml = engine.renderCtaButton({
        text: 'Login',
        url: 'https://smart-todo.net/login',
      });

      expect(buttonHtml).toContain('Login');
      expect(buttonHtml).toContain('https://smart-todo.net/login');
      expect(buttonHtml).not.toContain('word-break: break-all');
    });
  });

  describe('renderOtpChip', () => {
    it('should render 6-digit OTP in monospaced styled badge', () => {
      const otpHtml = engine.renderOtpChip('582914');

      expect(otpHtml).toContain('582914');
      expect(otpHtml).toContain('ui-monospace');
      expect(otpHtml).toContain('letter-spacing: 0.35em');
    });

    it('should sanitize raw OTP inputs', () => {
      const otpHtml = engine.renderOtpChip('<script>123</script>');

      expect(otpHtml).not.toContain('<script>');
      expect(otpHtml).toContain('&lt;script&gt;123&lt;/script&gt;');
    });
  });

  describe('renderAlertBox', () => {
    it('should render warning alert box with amber colors', () => {
      const alertHtml = engine.renderAlertBox({
        text: 'This link will expire in 1 hour.',
        type: 'warning',
      });

      expect(alertHtml).toContain('This link will expire in 1 hour.');
      expect(alertHtml).toContain('#fffbeb');
      expect(alertHtml).toContain('#92400e');
    });

    it('should render info alert box with slate colors', () => {
      const alertHtml = engine.renderAlertBox({
        text: 'You recently signed in from a new device.',
        type: 'info',
      });

      expect(alertHtml).toContain('You recently signed in from a new device.');
      expect(alertHtml).toContain('#f8fafc');
      expect(alertHtml).toContain('#475569');
    });
  });
});
