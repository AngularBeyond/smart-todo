import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from './app.module.js';

let cachedServer: (req: IncomingMessage, res: ServerResponse) => void;
let appInstance: INestApplication;

export async function bootstrapServer(): Promise<(req: IncomingMessage, res: ServerResponse) => void> {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('api/v1');
    app.use(helmet());
    app.use(cookieParser());

    app.enableCors({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
        if (!origin) return callback(null, true);

        // If FRONTEND_URL is explicitly configured, check it
        if (process.env.FRONTEND_URL) {
          const allowed = process.env.FRONTEND_URL.split(',').map((u) => u.trim());
          if (allowed.includes(origin) || allowed.includes('*')) {
            return callback(null, true);
          }
        }

        // Allow any Vercel deployment (*.vercel.app) or local development origins
        if (
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1')
        ) {
          return callback(null, true);
        }

        return callback(null, true);
      },
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    appInstance = app;
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Defensive fallback for serverless proxies where req.socket might be undefined
  if (!req.socket) {
    (req as any).socket = {
      remoteAddress: req.headers['x-forwarded-for'] || '127.0.0.1',
    };
  }
  const server = await bootstrapServer();
  server(req, res);
}
