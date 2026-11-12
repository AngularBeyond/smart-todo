import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToastService } from './toast.service';

vi.mock('@spartan-ng/brain/sonner', () => {
  const toastFn = vi.fn((..._args: unknown[]) => {}) as any;
  toastFn.error = vi.fn((..._args: unknown[]) => {});
  toastFn.success = vi.fn((..._args: unknown[]) => {});
  toastFn.info = vi.fn((..._args: unknown[]) => {});
  return { toast: toastFn };
});

import { toast } from '@spartan-ng/brain/sonner';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
    vi.clearAllMocks();
  });

  it('should call toast on show', () => {
    service.show('info msg', { position: 'top-center' });
    expect(toast).toHaveBeenCalledWith('info msg', { position: 'top-center' });
  });

  it('should call toast.success on success', () => {
    service.success('success msg', { position: 'top-center' });
    expect(toast.success).toHaveBeenCalledWith('success msg', { position: 'top-center' });
  });

  it('should call toast.error on error', () => {
    service.error('error msg', { position: 'top-center' });
    expect(toast.error).toHaveBeenCalledWith('error msg', { position: 'top-center' });
  });

  it('should call toast.info on info', () => {
    service.info('info msg', { position: 'top-center' });
    expect(toast.info).toHaveBeenCalledWith('info msg', { position: 'top-center' });
  });
});
