import { ConfigService } from '@nestjs/config';

export type EmailTransportType = 'ses' | 'local';

export interface EmailConfig {
  transport: EmailTransportType;
  fromAddress: string;
  fromName: string;
  aws: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
}

export const getEmailConfig = (configService: ConfigService): EmailConfig => {
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const configuredTransport = configService.get<string>('EMAIL_TRANSPORT');

  let transport: EmailTransportType = 'local';
  if (configuredTransport === 'ses') {
    transport = 'ses';
  } else if (configuredTransport === 'local') {
    transport = 'local';
  } else if (nodeEnv === 'production') {
    transport = 'ses';
  }

  const region = configService.get<string>('AWS_REGION', 'us-east-1');
  const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID');
  const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY');

  const fromAddress = configService.get<string>('EMAIL_FROM_ADDRESS', 'noreply@smart-todo.net');
  const fromName = configService.get<string>('EMAIL_FROM_NAME', 'Smart Todo');

  return {
    transport,
    fromAddress,
    fromName,
    aws: {
      region,
      ...(accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : {}),
    },
  };
};
