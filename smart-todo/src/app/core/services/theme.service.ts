import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

export type ThemeMode = 'light' | 'dark';
export const THEME_STORAGE_KEY = 'smart_todo_theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  getStoredTheme(): ThemeMode {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 'light';
    }
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch {
      // LocalStorage access may fail in sandboxed or private browsing environments
    }
    return 'light';
  }

  applyTheme(theme: ThemeMode): void {
    const root = this.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Ignore localStorage write errors
      }
    }
  }

  initTheme(): ThemeMode {
    const theme = this.getStoredTheme();
    this.applyTheme(theme);
    return theme;
  }
}
