export type EmailErrorCategory =
  | 'THROTTLED'
  | 'BOUNCE_RISK'
  | 'CONFIGURATION'
  | 'TRANSIENT_NETWORK'
  | 'UNKNOWN';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCategory?: EmailErrorCategory;
  attempts?: number;
  durationMs?: number;
}
