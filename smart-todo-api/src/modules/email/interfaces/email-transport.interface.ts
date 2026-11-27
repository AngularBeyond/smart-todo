import { EmailOptions } from './email-options.interface.js';
import { EmailSendResult } from './email-send-result.interface.js';

export interface EmailTransport {
  send(options: EmailOptions): Promise<EmailSendResult>;
}
