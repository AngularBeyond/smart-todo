import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should invoke methods safely without errors', () => {
    expect(() => service.show('info message', { position: 'top-center' })).not.toThrow();
    expect(() => service.success('success message', { position: 'top-center' })).not.toThrow();
    expect(() => service.error('error message', { position: 'top-center' })).not.toThrow();
    expect(() => service.info('info message', { position: 'top-center' })).not.toThrow();
  });
});
