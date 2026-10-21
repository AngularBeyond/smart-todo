import { describe, it, expect } from 'vitest';
import { of } from 'rxjs';
import { ApiResponseInterceptor } from './api-response.interceptor.js';

describe('ApiResponseInterceptor', () => {
  it('should wrap returned data in { success: true, data }', async () => {
    const interceptor = new ApiResponseInterceptor();
    const context: any = {};
    const next: any = {
      handle: () => of({ test: 'value' }),
    };

    const observable = interceptor.intercept(context, next);
    observable.subscribe((res) => {
      expect(res).toEqual({
        success: true,
        data: { test: 'value' },
      });
    });
  });

  it('should wrap undefined/null in { success: true, data: {} }', async () => {
    const interceptor = new ApiResponseInterceptor();
    const context: any = {};
    const next: any = {
      handle: () => of(null),
    };

    const observable = interceptor.intercept(context, next);
    observable.subscribe((res) => {
      expect(res).toEqual({
        success: true,
        data: {},
      });
    });
  });
});
