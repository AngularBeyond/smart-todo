import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
import { errorInterceptor } from './error.interceptor';
import { HTTP_ERROR_MESSAGES } from './http-error-messages.constants';
import { apiErrorOccurred } from '../store/events/api-error.events';
import { userLogout } from '../store/events/auth.events';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let dispatcher: Dispatcher;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideDispatcher(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    dispatcher = TestBed.inject(Dispatcher);
    vi.spyOn(dispatcher, 'dispatch');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should normalize status 0 to friendly network error message and dispatch event', () => {
    let actualError: HttpErrorResponse | undefined;

    httpClient.get('/api/test').subscribe({
      error: (err: HttpErrorResponse) => {
        actualError = err;
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(actualError).toBeDefined();
    expect(actualError?.status).toBe(0);
    expect(actualError?.error).toEqual({
      message: HTTP_ERROR_MESSAGES.NETWORK_ERROR,
    });
    expect(dispatcher.dispatch).toHaveBeenCalledWith(
      apiErrorOccurred({ message: HTTP_ERROR_MESSAGES.NETWORK_ERROR }),
    );
  });

  it('should normalize "Failed to fetch" error to friendly network error message', () => {
    let actualError: HttpErrorResponse | undefined;

    httpClient.get('/api/test').subscribe({
      error: (err: HttpErrorResponse) => {
        actualError = err;
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'Failed to fetch' }, { status: 0, statusText: 'Unknown Error' });

    expect(actualError?.error).toEqual({
      message: HTTP_ERROR_MESSAGES.NETWORK_ERROR,
    });
    expect(dispatcher.dispatch).toHaveBeenCalledWith(
      apiErrorOccurred({ message: HTTP_ERROR_MESSAGES.NETWORK_ERROR }),
    );
  });

  it('should normalize 500 Internal Server Error to friendly server error message and dispatch event', () => {
    let actualError: HttpErrorResponse | undefined;

    httpClient.get('/api/test').subscribe({
      error: (err: HttpErrorResponse) => {
        actualError = err;
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ error: 'Crash' }, { status: 500, statusText: 'Internal Server Error' });

    expect(actualError).toBeDefined();
    expect(actualError?.status).toBe(500);
    expect(actualError?.error).toEqual({
      message: HTTP_ERROR_MESSAGES.SERVER_ERROR,
    });
    expect(dispatcher.dispatch).toHaveBeenCalledWith(
      apiErrorOccurred({ message: HTTP_ERROR_MESSAGES.SERVER_ERROR }),
    );
  });

  it('should normalize NestJS validation error arrays to first message', () => {
    let actualError: HttpErrorResponse | undefined;

    httpClient.post('/api/test', {}).subscribe({
      error: (err: HttpErrorResponse) => {
        actualError = err;
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.flush(
      { message: ['name should not be empty', 'email must be valid'] },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(actualError?.error).toEqual({
      message: 'name should not be empty',
    });
    expect(dispatcher.dispatch).toHaveBeenCalledWith(
      apiErrorOccurred({ message: 'name should not be empty' }),
    );
  });

  it('should preserve backend custom business error message', () => {
    let actualError: HttpErrorResponse | undefined;

    httpClient.post('/api/auth/register', {}).subscribe({
      error: (err: HttpErrorResponse) => {
        actualError = err;
      },
    });

    const req = httpMock.expectOne('/api/auth/register');
    req.flush(
      { message: 'An account with this email already exists.' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(actualError?.error).toEqual({
      message: 'An account with this email already exists.',
    });
    expect(dispatcher.dispatch).toHaveBeenCalledWith(
      apiErrorOccurred({ message: 'An account with this email already exists.' }),
    );
  });

  it('should dispatch userLogout on 401 for protected endpoints', () => {
    httpClient.get('/api/v1/todos').subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('/api/v1/todos');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(dispatcher.dispatch).toHaveBeenCalledWith(userLogout());
  });

  it('should NOT dispatch userLogout on 401 for public auth endpoints', () => {
    httpClient.post('/api/v1/auth/login', {}).subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(dispatcher.dispatch).not.toHaveBeenCalledWith(userLogout());
    expect(dispatcher.dispatch).toHaveBeenCalledWith(
      apiErrorOccurred({ message: 'Invalid credentials' }),
    );
  });
});
