import { EmailErrorCategory } from './email-send-result.interface.js';

export interface EmailTelemetryEvent {
  event: 'email_dispatched' | 'email_failed';
  transport: 'ses' | 'local';
  recipientDomain: string;
  recipientCount: number;
  subject: string;
  messageId?: string;
  attempts: number;
  durationMs: number;
  success: boolean;
  errorCategory?: EmailErrorCategory;
  errorMessage?: string;
  timestamp: string;
}
