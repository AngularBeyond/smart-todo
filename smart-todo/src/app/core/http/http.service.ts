import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

  get<T>(url: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(url, {
      withCredentials: true,
      ...options,
    });
  }

  post<T>(url: string, body: unknown, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(url, body, {
      withCredentials: true,
      ...options,
    });
  }

  patch<T>(url: string, body: unknown, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(url, body, {
      withCredentials: true,
      ...options,
    });
  }

  delete<T>(url: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(url, {
      withCredentials: true,
      ...options,
    });
  }
}
