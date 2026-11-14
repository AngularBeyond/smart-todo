import { describe, it, expect, vi } from 'vitest';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from './http-exception.filter.js';

describe('GlobalHttpExceptionFilter', () => {
  it('should format HttpException into standard error envelope', () => {
    const filter = new GlobalHttpExceptionFilter();
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    const host: any = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusMock }),
        getRequest: () => ({ url: '/api/v1/test-endpoint' }),
      }),
    };

    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad Request',
        path: '/api/v1/test-endpoint',
      }),
    );
  });

  it('should format unexpected errors into 500 error envelope', () => {
    const loggerSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    const filter = new GlobalHttpExceptionFilter();
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    const host: any = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusMock }),
        getRequest: () => ({ url: '/api/v1/crash' }),
      }),
    };

    filter.catch(new Error('Unexpected database failure'), host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        errorCode: 'INTERNAL_SERVER_ERROR',
        path: '/api/v1/crash',
      }),
    );
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unexpected database failure'),
      expect.any(String),
    );
    loggerSpy.mockRestore();
  });
});
