import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './api-response.model';

export interface RequestOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  context?: HttpContext;
  params?: HttpParams | Record<string, string | number | boolean | readonly (string | number | boolean)[]>;
  reportProgress?: boolean;
  withCredentials?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private readonly http = inject(HttpClient);
  readonly apiUrl = environment.apiUrl;

  buildUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const base = (this.apiUrl ?? '').replace(/\/+$/, '');
    if (!base || url.startsWith(base)) {
      return url;
    }
    try {
      const basePath = base.startsWith('http') ? new URL(base).pathname : base;
      if (basePath && (url === basePath || url.startsWith(`${basePath}/`))) {
        const origin = base.startsWith('http') ? new URL(base).origin : '';
        return `${origin}${url}`;
      }
    } catch {
      // ignore parsing error
    }
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${base}${cleanPath}`;
  }

  get<T>(url: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(this.buildUrl(url), {
      withCredentials: true,
      ...options,
    });
  }

  post<T>(url: string, body: unknown, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.buildUrl(url), body, {
      withCredentials: true,
      ...options,
    });
  }

  patch<T>(url: string, body: unknown, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(this.buildUrl(url), body, {
      withCredentials: true,
      ...options,
    });
  }

  delete<T>(url: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(this.buildUrl(url), {
      withCredentials: true,
      ...options,
    });
  }
}
