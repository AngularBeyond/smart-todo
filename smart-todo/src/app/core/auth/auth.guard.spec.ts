import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
import { HttpService } from '../http/http.service';
import { AppStore } from '../store/app.store';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let appStore: InstanceType<typeof AppStore>;
  let router: Router;
  let httpMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };
  let dispatcher: Dispatcher;

  beforeEach(() => {
    httpMock = {
      get: vi.fn().mockReturnValue(of({ success: true, data: { profile: null } })),
      post: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideDispatcher(),
        AppStore,
        { provide: HttpService, useValue: httpMock },
      ],
    });

    appStore = TestBed.inject(AppStore);
    router = TestBed.inject(Router);
    dispatcher = TestBed.inject(Dispatcher);

    vi.spyOn(dispatcher, 'dispatch');
    appStore.clear();
  });

  it('should allow access immediately if store is already authenticated and has access token', () => {
    appStore.setAuthenticated(true);
    appStore.setAccessToken('valid-token');

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(true);
    expect(httpMock.post).not.toHaveBeenCalled();
  });

  it('should restore session via refresh endpoint and dispatch userAuthenticated when valid', async () => {
    httpMock.post.mockReturnValue(of({ success: true, data: { accessToken: 'new-token' } }));

    const obs$ = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    let allowed: boolean | UrlTree | undefined;
    (obs$ as any).subscribe((res: any) => {
      allowed = res;
    });

    expect(httpMock.post).toHaveBeenCalledWith('/api/v1/auth/refresh', {});
    expect(allowed).toBe(true);
    expect(appStore.accessToken()).toBe('new-token');
    expect(appStore.isAuthenticated()).toBe(true);
    expect(dispatcher.dispatch).toHaveBeenCalled();
  });

  it('should redirect to /login if refresh reports unauthenticated', async () => {
    httpMock.post.mockReturnValue(of({ success: false }));

    const obs$ = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    let allowed: boolean | UrlTree | undefined;
    (obs$ as any).subscribe((res: any) => {
      allowed = res;
    });

    expect(allowed instanceof UrlTree).toBe(true);
    expect((allowed as UrlTree).toString()).toBe('/login');
  });

  it('should redirect to /login if refresh call throws an error', async () => {
    httpMock.post.mockReturnValue(throwError(() => new Error('Network error')));

    const obs$ = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    let allowed: boolean | UrlTree | undefined;
    (obs$ as any).subscribe((res: any) => {
      allowed = res;
    });

    expect(allowed instanceof UrlTree).toBe(true);
    expect((allowed as UrlTree).toString()).toBe('/login');
  });
});
