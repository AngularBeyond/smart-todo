import { Injectable } from '@nestjs/common';

export interface BaseLayoutOptions {
  title: string;
  preheader?: string;
  content: string;
}

export interface CtaButtonOptions {
  text: string;
  url: string;
  secondaryNote?: string;
}

export interface AlertBoxOptions {
  text: string;
  type?: 'info' | 'warning';
}

@Injectable()
export class EmailTemplateEngine {
  /**
   * Escapes untrusted user strings to prevent HTML/XSS injection in email clients.
   */
  escapeHtml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Renders the bulletproof responsive HTML email frame aligned with Smart Todo design tokens.
   */
  renderBaseLayout(options: BaseLayoutOptions): string {
    const escapedTitle = this.escapeHtml(options.title);
    const preheaderHtml = options.preheader
      ? `<span style="display:none;font-size:0px;line-height:0px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">${this.escapeHtml(options.preheader)}</span>`
      : '';

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { color: #2563eb; text-decoration: none; }
    .email-container { max-width: 600px; margin: 0 auto; width: 100%; }
    .content-card { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    @media only screen and (max-width: 620px) {
      .content-card { padding: 28px 20px !important; border-radius: 8px !important; }
      .email-container { width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  ${preheaderHtml}
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="email-container" width="600">
          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 700; font-size: 20px; line-height: 28px; padding: 6px 14px; border-radius: 8px; letter-spacing: -0.02em;">Smart Todo</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 6px;">
                    <span style="font-size: 13px; color: #64748b; letter-spacing: -0.01em;">Your tasks, orchestrated by agents.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td class="content-card" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px 36px;">
              ${options.content}
            </td>
          </tr>

          <!-- Security Disclaimer & Footer -->
          <tr>
            <td align="center" style="padding-top: 24px; font-size: 12px; line-height: 18px; color: #94a3b8;">
              <p style="margin: 0 0 6px 0;">This is an automated security transmission from <strong>Smart Todo</strong>.</p>
              <p style="margin: 0 0 6px 0;">If you did not initiate this request, please disregard this email or contact support.</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Smart Todo. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Renders a responsive primary Call-To-Action (CTA) button.
   */
  renderCtaButton(options: CtaButtonOptions): string {
    const escapedText = this.escapeHtml(options.text);
    const escapedUrl = this.escapeHtml(options.url);

    const secondaryHtml = options.secondaryNote
      ? `<div style="padding-top: 20px; font-size: 13px; color: #64748b; line-height: 20px; word-break: break-all;">
          ${this.escapeHtml(options.secondaryNote)}<br>
          <a href="${escapedUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">${escapedUrl}</a>
         </div>`
      : '';

    return `
      <div style="margin: 28px 0; text-align: center;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
            <td align="center" bgcolor="#2563eb" style="border-radius: 8px;">
              <a href="${escapedUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; background-color: #2563eb; letter-spacing: -0.01em;">
                ${escapedText}
              </a>
            </td>
          </tr>
        </table>
        ${secondaryHtml}
      </div>`;
  }

  /**
   * Renders a styled 6-digit numeric OTP container for 2FA verification.
   */
  renderOtpChip(otp: string): string {
    const escapedOtp = this.escapeHtml(otp.trim());

    return `
      <div style="margin: 28px 0; text-align: center;">
        <div style="display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 28px;">
          <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.35em; color: #0f172a; display: block; margin-right: -0.35em;">
            ${escapedOtp}
          </span>
        </div>
      </div>`;
  }

  /**
   * Renders an informational or warning callout alert box.
   */
  renderAlertBox(options: AlertBoxOptions): string {
    const isWarning = options.type === 'warning';
    const bgColor = isWarning ? '#fffbeb' : '#f8fafc';
    const borderColor = isWarning ? '#fcd34d' : '#e2e8f0';
    const textColor = isWarning ? '#92400e' : '#475569';
    const escapedText = this.escapeHtml(options.text);

    return `
      <div style="margin: 20px 0; padding: 14px 18px; background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px; font-size: 13px; line-height: 20px; color: ${textColor};">
        ${escapedText}
      </div>`;
  }
}
