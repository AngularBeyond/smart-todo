export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  message: string | string[];
  timestamp: string;
  path: string;
}
