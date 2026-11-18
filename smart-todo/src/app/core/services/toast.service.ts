import { Injectable } from '@angular/core';
import { toast } from '@spartan-ng/brain/sonner';

@Injectable({ providedIn: 'root' })
export class ToastService {
  show(message: string, options?: Record<string, unknown>): string | number {
    return toast(message, options);
  }

  success(message: string, options?: Record<string, unknown>): string | number {
    return toast.success(message, options);
  }

  error(message: string, options?: Record<string, unknown>): string | number {
    return toast.error(message, options);
  }

  info(message: string, options?: Record<string, unknown>): string | number {
    return toast.info(message, options);
  }

  dismiss(id?: string | number): void {
    toast.dismiss(id);
  }
}
