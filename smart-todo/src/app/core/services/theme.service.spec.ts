import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let documentMock: Document;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [ThemeService],
    });

    service = TestBed.inject(ThemeService);
    documentMock = TestBed.inject(DOCUMENT);
    documentMock.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    documentMock.documentElement.classList.remove('dark');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStoredTheme', () => {
    it('should default to light theme when localStorage is empty', () => {
      expect(service.getStoredTheme()).toBe('light');
    });

    it('should return stored dark theme when present in localStorage', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      expect(service.getStoredTheme()).toBe('dark');
    });

    it('should return stored light theme when present in localStorage', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      expect(service.getStoredTheme()).toBe('light');
    });

    it('should fallback to light theme when localStorage contains an invalid value', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'invalid-theme');
      expect(service.getStoredTheme()).toBe('light');
    });
  });

  describe('applyTheme', () => {
    it('should add dark class to root document and persist to localStorage', () => {
      service.applyTheme('dark');

      expect(documentMock.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    });

    it('should remove dark class from root document and persist to localStorage', () => {
      documentMock.documentElement.classList.add('dark');

      service.applyTheme('light');

      expect(documentMock.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    });
  });

  describe('initTheme', () => {
    it('should initialize and apply dark theme if stored in localStorage', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');

      const activeTheme = service.initTheme();

      expect(activeTheme).toBe('dark');
      expect(documentMock.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should initialize and apply default light theme if no theme is stored', () => {
      const activeTheme = service.initTheme();

      expect(activeTheme).toBe('light');
      expect(documentMock.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
