import { Signal, signal, effect, Injector } from '@angular/core';

/**
 * Creates a debounced readonly Signal from a source Signal with a given delay in milliseconds.
 */
export function debounceSignal<T>(
  source: Signal<T>,
  delayMs: number,
  options?: { injector?: Injector },
): Signal<T> {
  const debounced = signal<T>(source());
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  effect(
    (onCleanup) => {
      const value = source();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        debounced.set(value);
      }, delayMs);

      onCleanup(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
    },
    options?.injector ? { injector: options.injector } : undefined,
  );

  return debounced.asReadonly();
}
