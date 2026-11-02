import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { HttpService } from './http.service';
import { ApiResponse } from './api-response.model';

describe('HttpService', () => {
  let service: HttpService;
  let httpClientMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    httpClientMock = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        HttpService,
        { provide: HttpClient, useValue: httpClientMock },
      ],
    });

    service = TestBed.inject(HttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call get with apiUrl prefix and withCredentials: true', () => {
    const mockResponse: ApiResponse<{ name: string }> = {
      success: true,
      data: { name: 'Test' },
    };
    httpClientMock.get.mockReturnValue(of(mockResponse));

    service.get('/test').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    expect(httpClientMock.get).toHaveBeenCalledWith(service.buildUrl('/test'), {
      withCredentials: true,
    });
  });

  it('should call post with apiUrl prefix and withCredentials: true', () => {
    const mockResponse: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: '123' },
    };
    httpClientMock.post.mockReturnValue(of(mockResponse));

    service.post('/test', { key: 'value' }).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    expect(httpClientMock.post).toHaveBeenCalledWith(
      service.buildUrl('/test'),
      { key: 'value' },
      { withCredentials: true },
    );
  });

  it('should call patch with apiUrl prefix and withCredentials: true', () => {
    const mockResponse: ApiResponse<{ updated: boolean }> = {
      success: true,
      data: { updated: true },
    };
    httpClientMock.patch.mockReturnValue(of(mockResponse));

    service.patch('/test/1', { updated: true }).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    expect(httpClientMock.patch).toHaveBeenCalledWith(
      service.buildUrl('/test/1'),
      { updated: true },
      { withCredentials: true },
    );
  });

  it('should call delete with apiUrl prefix and withCredentials: true', () => {
    const mockResponse: ApiResponse<null> = {
      success: true,
      data: null,
    };
    httpClientMock.delete.mockReturnValue(of(mockResponse));

    service.delete('/test/1').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    expect(httpClientMock.delete).toHaveBeenCalledWith(service.buildUrl('/test/1'), {
      withCredentials: true,
    });
  });

  it('should preserve URL when it already starts with apiUrl', () => {
    httpClientMock.get.mockReturnValue(of({ success: true, data: null }));

    service.get('/api/v1/custom').subscribe();

    expect(httpClientMock.get).toHaveBeenCalledWith(service.buildUrl('/api/v1/custom'), {
      withCredentials: true,
    });
  });

  it('should preserve absolute external URLs', () => {
    httpClientMock.get.mockReturnValue(of({ success: true, data: null }));

    service.get('https://external.api/data').subscribe();

    expect(httpClientMock.get).toHaveBeenCalledWith('https://external.api/data', {
      withCredentials: true,
    });
  });
});
