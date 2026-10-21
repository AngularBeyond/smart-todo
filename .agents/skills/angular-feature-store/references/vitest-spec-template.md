# Vitest Unit Test Template for Feature Signal Store

Co-locate the test suite directly adjacent to the store: `src/app/features/<feature>/store/<feature-name>.store.spec.ts`.

## Complete Vitest Test Suite

```typescript
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { HTTP_ERROR_MESSAGES, HttpService } from '@core';
import { FeatureStore } from './feature.store';
import { FeatureResponse } from '../models';

describe('FeatureStore', () => {
  let store: InstanceType<typeof FeatureStore>;
  let httpServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };

  const mockItem = { id: 'item-1', name: 'Item One' };
  const mockResponse: FeatureResponse = {
    success: true,
    data: [mockItem],
  };

  beforeEach(() => {
    httpServiceMock = {
      get: vi.fn(),
      post: vi.fn(),
    };
    routerMock = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        FeatureStore,
        { provide: HttpService, useValue: httpServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    store = TestBed.inject(FeatureStore);
    store.clearError();
  });

  describe('Initial State', () => {
    it('should initialize with idle request status and empty items', () => {
      expect(store.isPending()).toBe(false);
      expect(store.isFulfilled()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.items()).toEqual([]);
      expect(store.hasItems()).toBe(false);
    });
  });

  describe('loadItems', () => {
    it('should successfully load items and transition to fulfilled status', () => {
      httpServiceMock.get.mockReturnValue(of(mockResponse));

      store.loadItems();

      expect(store.isPending()).toBe(false);
      expect(store.isFulfilled()).toBe(true);
      expect(store.error()).toBeNull();
      expect(store.items()).toEqual([mockItem]);
      expect(store.hasItems()).toBe(true);
      expect(httpServiceMock.get).toHaveBeenCalledWith('/v1/feature/items');
    });

    it('should handle API error and capture error message', () => {
      const errorResponse = new HttpErrorResponse({
        status: 400,
        error: { message: 'Entity not found' },
      });
      httpServiceMock.get.mockReturnValue(throwError(() => errorResponse));

      store.loadItems();

      expect(store.isPending()).toBe(false);
      expect(store.isFulfilled()).toBe(false);
      expect(store.error()).toBe('Entity not found');
    });

    it('should fallback to UNKNOWN_ERROR if server error body is empty', () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: null,
      });
      httpServiceMock.get.mockReturnValue(throwError(() => errorResponse));

      store.loadItems();

      expect(store.isPending()).toBe(false);
      expect(store.error()).toBe(HTTP_ERROR_MESSAGES.UNKNOWN_ERROR);
    });

    it('should maintain rxMethod stream resilience across multiple calls after error', () => {
      // 1. First call fails
      const errorResponse = new HttpErrorResponse({ status: 503 });
      httpServiceMock.get.mockReturnValueOnce(throwError(() => errorResponse));
      store.loadItems();
      expect(store.error()).not.toBeNull();

      // 2. Second call succeeds (proves inner catchError kept stream alive)
      httpServiceMock.get.mockReturnValueOnce(of(mockResponse));
      store.loadItems();

      expect(store.isFulfilled()).toBe(true);
      expect(store.items()).toEqual([mockItem]);
    });
  });

  describe('saveItem', () => {
    it('should call post and navigate on success', () => {
      const singleResponse = { success: true, data: mockItem };
      httpServiceMock.post.mockReturnValue(of(singleResponse));

      store.saveItem({ name: 'Item One' });

      expect(store.isFulfilled()).toBe(true);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/items', 'item-1']);
    });
  });

  describe('clearError', () => {
    it('should reset request status to idle', () => {
      const errorResponse = new HttpErrorResponse({
        status: 422,
        error: { message: 'Validation failed' },
      });
      httpServiceMock.get.mockReturnValue(throwError(() => errorResponse));
      store.loadItems();
      expect(store.error()).toBe('Validation failed');

      store.clearError();

      expect(store.error()).toBeNull();
      expect(store.isPending()).toBe(false);
    });
  });
});
```
