import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
        errorCode = exception.name.toUpperCase().replace(/\s+/g, '_');
      } else if (typeof res === 'object' && res !== null) {
        const errorPayload = res as Record<string, unknown>;
        message =
          (errorPayload['message'] as string | string[]) || exception.message;
        errorCode =
          (errorPayload['error'] as string)?.toUpperCase().replace(/\s+/g, '_') ||
          (errorPayload['errorCode'] as string) ||
          exception.name.toUpperCase().replace(/\s+/g, '_');
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request?.url || '',
    };

    response.status(status).json(errorResponse);
  }
}
