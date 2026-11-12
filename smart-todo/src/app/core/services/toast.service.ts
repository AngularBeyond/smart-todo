import { Injectable } from '@angular/core';
import { toast } from '@spartan-ng/brain/sonner';

@Injectable({ providedIn: 'root' })
export class ToastService {
  show(message: string, options?: Record<string, unknown>): void {
    toast(message, options);
  }

  success(message: string, options?: Record<string, unknown>): void {
    toast.success(message, options);
  }

  error(message: string, options?: Record<string, unknown>): void {
    toast.error(message, options);
  }

  info(message: string, options?: Record<string, unknown>): void {
    toast.info(message, options);
  }
}
