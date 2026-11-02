import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
import { environment } from '../../../environments/environment';
import { AppStore } from '../store/app.store';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let appStore: InstanceType<typeof AppStore>;
  let dispatcher: Dispatcher;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideDispatcher(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        AppStore,
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    appStore = TestBed.inject(AppStore);
    dispatcher = TestBed.inject(Dispatcher);
    const router = TestBed.inject(Router);

    vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
    vi.spyOn(dispatcher, 'dispatch');
    appStore.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach Bearer token and withCredentials to /api/v1/ requests when token is present', () => {
    appStore.setAccessToken('my-test-access-token');

    http.get('/api/v1/test-endpoint').subscribe();

    const req = httpMock.expectOne('/api/v1/test-endpoint');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-test-access-token');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ success: true });
  });

  it('should NOT attach Authorization header to public auth requests', () => {
    appStore.setAccessToken('my-test-access-token');

    http.post('/api/v1/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(req.request.withCredentials).toBe(true);
    req.flush({ success: true });
  });

  it('should attempt refresh rotation on 401 error and retry the original request', () => {
    appStore.setAccessToken('expired-access-token');

    let responseData: unknown;
    http.get('/api/v1/todos').subscribe((res) => {
      responseData = res;
    });

    // Initial request fails with 401
    const originalReq = httpMock.expectOne('/api/v1/todos');
    originalReq.flush('Token expired', { status: 401, statusText: 'Unauthorized' });

    // Interceptor triggers POST ${environment.apiUrl}/auth/refresh
    const refreshReq = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(refreshReq.request.method).toBe('POST');
    refreshReq.flush({ success: true, data: { accessToken: 'new-fresh-access-token' } });

    // Store should be updated with new token
    expect(appStore.accessToken()).toBe('new-fresh-access-token');

    // Original request retried with new Bearer token
    const retriedReq = httpMock.expectOne('/api/v1/todos');
    expect(retriedReq.request.headers.get('Authorization')).toBe('Bearer new-fresh-access-token');
    retriedReq.flush({ success: true, data: [{ id: 1, title: 'Test Task' }] });

    expect(responseData).toEqual({ success: true, data: [{ id: 1, title: 'Test Task' }] });
  });

  it('should dispatch userLogout when token refresh fails with 401', () => {
    appStore.setAccessToken('expired-access-token');

    let errorOccurred = false;
    http.get('/api/v1/todos').subscribe({
      next: () => {},
      error: () => {
        errorOccurred = true;
      },
    });

    const originalReq = httpMock.expectOne('/api/v1/todos');
    originalReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    const refreshReq = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    refreshReq.flush('Refresh expired', { status: 401, statusText: 'Unauthorized' });

    // AppStore reacts to userLogout by calling /api/v1/auth/logout
    const logoutReq = httpMock.expectOne((r) => r.url.includes('/auth/logout'));
    logoutReq.flush({ success: true, data: { loggedOut: true } });

    expect(dispatcher.dispatch).toHaveBeenCalled();
    expect(errorOccurred).toBe(true);
  });
});
