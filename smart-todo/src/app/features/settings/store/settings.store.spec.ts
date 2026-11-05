import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { SettingsStore } from './settings.store';
import { DEFAULT_SETTINGS } from '../constants';

describe('SettingsStore', () => {
  let store: InstanceType<typeof SettingsStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SettingsStore],
    });
    store = TestBed.inject(SettingsStore);
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

  it('should set appearance mode', () => {
    store.setAppearance('dark');
    expect(store.settings().appearance).toBe('dark');
    expect(store.saved()).toBe(true);

    store.setAppearance('system');
    expect(store.settings().appearance).toBe('system');
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
