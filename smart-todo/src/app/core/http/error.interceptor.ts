import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Dispatcher } from '@ngrx/signals/events';
import { catchError, throwError } from 'rxjs';
import { HTTP_ERROR_MESSAGES } from './http-error-messages.constants';
import { apiErrorOccurred } from '../store/events/api-error.events';
import { userLogout } from '../store/events/auth.events';

function extractFirstValidationError(errors: unknown): string | undefined {
  if (!errors || typeof errors !== 'object') {
    return undefined;
  }

  const firstVal = Object.values(errors)[0];
  if (Array.isArray(firstVal) && typeof firstVal[0] === 'string') {
    return firstVal[0];
  }
  if (typeof firstVal === 'string') {
    return firstVal;
  }

  return undefined;
}

export function resolveErrorMessage(error: HttpErrorResponse): string {
  if (
    error.status === 0 ||
    error.message?.includes('Failed to fetch') ||
    (typeof error.error === 'string' && error.error.includes('Failed to fetch')) ||
    (typeof error.error?.message === 'string' && error.error.message.includes('Failed to fetch'))
  ) {
    return HTTP_ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (error.status >= 500 && error.status < 600) {
    return HTTP_ERROR_MESSAGES.SERVER_ERROR;
  }

  const firstValidationError = extractFirstValidationError(error.error?.errors);
  if (firstValidationError) {
    return firstValidationError;
  }

  if (Array.isArray(error.error?.message) && typeof error.error.message[0] === 'string') {
    return error.error.message[0];
  }

  if (typeof error.error?.message === 'string' && error.error.message.trim().length > 0) {
    return error.error.message;
  }

  if (typeof error.error === 'string' && error.error.trim().length > 0) {
    return error.error;
  }

  return HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
}

function handleUnauthorized(url: string, dispatcher: Dispatcher): void {
  if (
    !url.includes('/auth/logout') &&
    !url.includes('/auth/login') &&
    !url.includes('/auth/register') &&
    !url.includes('/auth/refresh')
  ) {
    dispatcher.dispatch(userLogout());
  }
}

function createNormalizedError(error: HttpErrorResponse, message: string): HttpErrorResponse {
  return new HttpErrorResponse({
    error: {
      message,
    },
    headers: error.headers,
    status: error.status,
    statusText: error.statusText,
    url: error.url ?? undefined,
  });
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const dispatcher = inject(Dispatcher);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        const fallbackMsg = HTTP_ERROR_MESSAGES.NETWORK_ERROR;
        dispatcher.dispatch(apiErrorOccurred({ message: fallbackMsg }));
        return throwError(
          () =>
            new HttpErrorResponse({
              error: { message: fallbackMsg },
              status: 0,
              statusText: 'Unknown Error',
            }),
        );
      }

      const message = resolveErrorMessage(error);

      if (error.status === 401) {
        handleUnauthorized(req.url, dispatcher);
      }

      dispatcher.dispatch(apiErrorOccurred({ message }));
      return throwError(() => createNormalizedError(error, message));
    }),
  );
};
