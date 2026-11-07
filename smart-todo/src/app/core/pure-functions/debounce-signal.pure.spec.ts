import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounceSignal } from './debounce-signal.pure';

describe('debounceSignal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with source value and update after delay', () => {
    TestBed.runInInjectionContext(() => {
      const source = signal('initial');
      const debounced = debounceSignal(source, 400);

      expect(debounced()).toBe('initial');

      source.set('updated');
      TestBed.flushEffects();

      expect(debounced()).toBe('initial');

      vi.advanceTimersByTime(399);
      expect(debounced()).toBe('initial');

      vi.advanceTimersByTime(1);
      expect(debounced()).toBe('updated');
    });
  });

  it('should debounce rapid changes and only set the latest value', () => {
    TestBed.runInInjectionContext(() => {
      const source = signal('first');
      const debounced = debounceSignal(source, 400);

      source.set('second');
      TestBed.flushEffects();
      vi.advanceTimersByTime(200);

      source.set('third');
      TestBed.flushEffects();
      vi.advanceTimersByTime(200);

      expect(debounced()).toBe('first');

      vi.advanceTimersByTime(200);
      expect(debounced()).toBe('third');
    });
  });
});
