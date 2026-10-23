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
  };
  let dispatcher: Dispatcher;

  beforeEach(() => {
    httpMock = {
      get: vi.fn(),
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

  it('should allow access immediately if store is already authenticated', () => {
    appStore.setAuthenticated(true);

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(true);
    expect(httpMock.get).not.toHaveBeenCalled();
  });

  it('should verify session via API and dispatch userAuthenticated when valid', async () => {
    httpMock.get.mockReturnValue(of({ success: true, data: { authenticated: true } }));

    const obs$ = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    let allowed: boolean | UrlTree | undefined;
    (obs$ as any).subscribe((res: any) => {
      allowed = res;
    });

    expect(httpMock.get).toHaveBeenCalledWith('/v1/auth/authenticated');
    expect(allowed).toBe(true);
    expect(dispatcher.dispatch).toHaveBeenCalled();
  });

  it('should redirect to /login if API reports unauthenticated', async () => {
    httpMock.get.mockReturnValue(of({ success: false }));

    const obs$ = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    let allowed: boolean | UrlTree | undefined;
    (obs$ as any).subscribe((res: any) => {
      allowed = res;
    });

    expect(allowed instanceof UrlTree).toBe(true);
    expect((allowed as UrlTree).toString()).toBe('/login');
  });

  it('should redirect to /login if API call throws an error', async () => {
    httpMock.get.mockReturnValue(throwError(() => new Error('Network error')));

    const obs$ = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    let allowed: boolean | UrlTree | undefined;
    (obs$ as any).subscribe((res: any) => {
      allowed = res;
    });

    expect(allowed instanceof UrlTree).toBe(true);
    expect((allowed as UrlTree).toString()).toBe('/login');
  });
});
