import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
import { THEME_STORAGE_KEY, ThemeService, themeChanged } from '@core';
import { SettingsStore } from './settings.store';
import { DEFAULT_SETTINGS } from '../constants';

describe('SettingsStore', () => {
  let store: InstanceType<typeof SettingsStore>;
  let dispatcher: Dispatcher;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideDispatcher(), SettingsStore, ThemeService],
    });
    dispatcher = TestBed.inject(Dispatcher);
    vi.spyOn(dispatcher, 'dispatch');
    store = TestBed.inject(SettingsStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with default settings and saved true', () => {
    expect(store.settings()).toEqual(DEFAULT_SETTINGS);
    expect(store.saved()).toBe(true);
    expect(store.isPending()).toBe(false);
    expect(store.isFulfilled()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should toggle notifications flag', () => {
    expect(store.settings().notifications).toBe(true);
    store.toggleNotifications();
    expect(store.settings().notifications).toBe(false);
    expect(store.saved()).toBe(true);

    store.toggleNotifications();
    expect(store.settings().notifications).toBe(true);
  });

  it('should set appearance mode and dispatch themeChanged event', () => {
    store.setAppearance('dark');
    expect(store.settings().appearance).toBe('dark');
    expect(store.saved()).toBe(true);
    expect(dispatcher.dispatch).toHaveBeenCalledWith(themeChanged({ mode: 'dark' }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    store.setAppearance('system');
    expect(store.settings().appearance).toBe('system');
  });

  it('should toggle appearance between light and dark', () => {
    expect(store.settings().appearance).toBe('light');

    store.toggleAppearance();
    expect(store.settings().appearance).toBe('dark');
    expect(dispatcher.dispatch).toHaveBeenCalledWith(themeChanged({ mode: 'dark' }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    store.toggleAppearance();
    expect(store.settings().appearance).toBe('light');
    expect(dispatcher.dispatch).toHaveBeenCalledWith(themeChanged({ mode: 'light' }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('should synchronize appearance when themeChanged event is dispatched', () => {
    dispatcher.dispatch(themeChanged({ mode: 'dark' }));
    expect(store.settings().appearance).toBe('dark');

    dispatcher.dispatch(themeChanged({ mode: 'light' }));
    expect(store.settings().appearance).toBe('light');
  });

  it('should initialize appearance from localStorage if present', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideDispatcher(), SettingsStore, ThemeService],
    });
    const darkStore = TestBed.inject(SettingsStore);
    expect(darkStore.settings().appearance).toBe('dark');
  });

  it('should toggle start of week between Monday and Sunday', () => {
    expect(store.settings().startOfWeek).toBe('Monday');
    store.toggleStartOfWeek();
    expect(store.settings().startOfWeek).toBe('Sunday');
    expect(store.saved()).toBe(true);

    store.toggleStartOfWeek();
    expect(store.settings().startOfWeek).toBe('Monday');
  });

  it('should mark saved state', () => {
    store.markSaved();
    expect(store.saved()).toBe(true);
  });
});
