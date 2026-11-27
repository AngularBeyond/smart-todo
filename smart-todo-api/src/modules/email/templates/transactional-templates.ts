import { EmailTemplateEngine } from './email-template.engine.js';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface VerificationEmailParams {
  name: string;
  verifyUrl: string;
  expiresInHours?: number;
}

export interface PasswordResetEmailParams {
  name: string;
  resetUrl: string;
  expiresInHours?: number;
}

export interface OtpEmailParams {
  name: string;
  otp: string;
  expiresInMinutes?: number;
}

export class TransactionalTemplates {
  constructor(private readonly engine: EmailTemplateEngine) {}

  /**
   * Renders the user registration email verification template.
   */
  renderVerificationEmail(params: VerificationEmailParams): RenderedEmail {
    const hours = params.expiresInHours ?? 24;
    const escapedName = this.engine.escapeHtml(params.name || 'there');
    const subject = 'Verify your email address - Smart Todo';
    const preheader = `Welcome to Smart Todo! Please verify your email address to activate your account.`;

    const content = `
      <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 30px; letter-spacing: -0.02em;">
        Welcome to Smart Todo!
      </h1>
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 24px;">
        Hi ${escapedName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 24px;">
        Thank you for creating an account with Smart Todo. To complete your registration and secure your workspace, please verify your email address by clicking the button below:
      </p>
      ${this.engine.renderCtaButton({
        text: 'Verify Email Address',
        url: params.verifyUrl,
        secondaryNote: 'If the button above does not work, copy and paste this link into your web browser:',
      })}
      ${this.engine.renderAlertBox({
        text: `This verification link is single-use and will expire in ${hours} hours.`,
        type: 'info',
      })}
      <p style="margin: 16px 0 0 0; font-size: 13px; color: #64748b; line-height: 20px;">
        If you did not register for a Smart Todo account, no further action is required and you can safely ignore this email.
      </p>
    `;

    const html = this.engine.renderBaseLayout({
      title: subject,
      preheader,
      content,
    });

    const text = `Welcome to Smart Todo!

Hi ${params.name || 'there'},

Please verify your email address by clicking the following link:
${params.verifyUrl}

This link is single-use and will expire in ${hours} hours.

If you did not create an account, you can safely ignore this email.
- The Smart Todo Team`;

    return { subject, html, text };
  }

  /**
   * Renders the self-service forgot password reset template.
   */
  renderPasswordResetEmail(params: PasswordResetEmailParams): RenderedEmail {
    const hours = params.expiresInHours ?? 1;
    const escapedName = this.engine.escapeHtml(params.name || 'there');
    const subject = 'Reset your password - Smart Todo';
    const preheader = `You requested a password reset for your Smart Todo account.`;

    const content = `
      <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 30px; letter-spacing: -0.02em;">
        Password Reset Request
      </h1>
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 24px;">
        Hi ${escapedName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 24px;">
        We received a request to reset the password for your Smart Todo account. Click the button below to choose a new password:
      </p>
      ${this.engine.renderCtaButton({
        text: 'Reset My Password',
        url: params.resetUrl,
        secondaryNote: 'If the button above does not work, copy and paste this link into your web browser:',
      })}
      ${this.engine.renderAlertBox({
        text: `Security Notice: This link will expire in ${hours} hour${hours > 1 ? 's' : ''} and can only be used once.`,
        type: 'warning',
      })}
      <p style="margin: 16px 0 0 0; font-size: 13px; color: #64748b; line-height: 20px;">
        If you did not request a password reset, your account is safe and you can ignore this email. Your password will remain unchanged.
      </p>
    `;

    const html = this.engine.renderBaseLayout({
      title: subject,
      preheader,
      content,
    });

    const text = `Password Reset Request

Hi ${params.name || 'there'},

We received a request to reset your Smart Todo account password.
Click the link below to set a new password:
${params.resetUrl}

This link will expire in ${hours} hour${hours > 1 ? 's' : ''}.

If you did not make this request, you can safely ignore this email.
- The Smart Todo Team`;

    return { subject, html, text };
  }

  /**
   * Renders the Two-Factor Authentication (2FA) One-Time Passcode (OTP) template.
   */
  renderOtpEmail(params: OtpEmailParams): RenderedEmail {
    const minutes = params.expiresInMinutes ?? 10;
    const escapedName = this.engine.escapeHtml(params.name || 'there');
    const subject = `${params.otp} is your Smart Todo verification code`;
    const preheader = `Your 6-digit login verification code is ${params.otp}. It will expire in ${minutes} minutes.`;

    const content = `
      <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 30px; letter-spacing: -0.02em;">
        Two-Factor Verification
      </h1>
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 24px;">
        Hi ${escapedName},
      </p>
      <p style="margin: 0 0 8px 0; font-size: 15px; color: #334155; line-height: 24px;">
        Here is your single-use 6-digit verification code to complete your sign-in:
      </p>
      ${this.engine.renderOtpChip(params.otp)}
      ${this.engine.renderAlertBox({
        text: `This code expires in ${minutes} minutes and can only be used once. Never share this code with anyone.`,
        type: 'warning',
      })}
      <p style="margin: 16px 0 0 0; font-size: 13px; color: #64748b; line-height: 20px;">
        If you did not attempt to sign in, someone may know your password. We recommend changing your password immediately.
      </p>
    `;

    const html = this.engine.renderBaseLayout({
      title: subject,
      preheader,
      content,
    });

    const text = `Your Smart Todo Verification Code

Hi ${params.name || 'there'},

Your single-use login code is: ${params.otp}

This code expires in ${minutes} minutes.
Never share this code with anyone.

- The Smart Todo Team`;

    return { subject, html, text };
  }
}
