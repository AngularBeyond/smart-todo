import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
import { AppStore, themeChanged } from '@core';
import { SettingsPage } from './settings-page';
import { SettingsStore } from '../../store';

describe('SettingsPage', () => {
  let fixture: ComponentFixture<SettingsPage>;
  let component: SettingsPage;
  let element: HTMLElement;
  let dispatcher: Dispatcher;

  const mockTheme = signal<'light' | 'dark'>('light');

  const mockAppStore = {
    theme: mockTheme.asReadonly(),
  };

  beforeEach(async () => {
    mockTheme.set('light');

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        provideRouter([]),
        provideDispatcher(),
        { provide: AppStore, useValue: mockAppStore },
        SettingsStore,
      ],
    }).compileComponents();

    dispatcher = TestBed.inject(Dispatcher);
    vi.spyOn(dispatcher, 'dispatch');

    fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create settings page component', () => {
    expect(component).toBeTruthy();
  });

  it('should render page title and workspace preferences card with notifications and theme but without start of week', () => {
    expect(element.textContent).toContain('Settings');
    expect(element.textContent).toContain('Workspace preferences');
    expect(element.textContent).toContain('Notifications');
    expect(element.textContent).toContain('Preferred theme');
    expect(element.textContent).not.toContain('Start of week');
  });

  it('should render light and dark theme buttons', () => {
    const buttons = element.querySelectorAll<HTMLButtonElement>('button[type="button"]');
    const lightBtn = Array.from(buttons).find((b) => b.textContent?.includes('Light'));
    const darkBtn = Array.from(buttons).find((b) => b.textContent?.includes('Dark'));

    expect(lightBtn).toBeTruthy();
    expect(darkBtn).toBeTruthy();
  });

  it('should dispatch themeChanged with dark and update store when Dark button is clicked', () => {
    const buttons = element.querySelectorAll<HTMLButtonElement>('button[type="button"]');
    const darkBtn = Array.from(buttons).find((b) => b.textContent?.includes('Dark'));

    darkBtn?.click();
    expect(dispatcher.dispatch).toHaveBeenCalledWith(themeChanged({ mode: 'dark' }));
    expect((component as any).store.settings().appearance).toBe('dark');
  });

  it('should dispatch themeChanged with light and update store when Light button is clicked', () => {
    mockTheme.set('dark');
    fixture.detectChanges();

    const buttons = element.querySelectorAll<HTMLButtonElement>('button[type="button"]');
    const lightBtn = Array.from(buttons).find((b) => b.textContent?.includes('Light'));

    lightBtn?.click();
    expect(dispatcher.dispatch).toHaveBeenCalledWith(themeChanged({ mode: 'light' }));
    expect((component as any).store.settings().appearance).toBe('light');
  });

  it('should update store and dispatch themeChanged when setTheme is called directly', () => {
    component.setTheme('dark');
    expect(dispatcher.dispatch).toHaveBeenCalledWith(themeChanged({ mode: 'dark' }));
    expect((component as any).store.settings().appearance).toBe('dark');
  });
});
