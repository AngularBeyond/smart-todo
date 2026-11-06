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

  it('should render page title and workspace preferences card', () => {
    expect(element.textContent).toContain('Settings');
    expect(element.textContent).toContain('Workspace preferences');
    expect(element.textContent).toContain('Appearance');
  });

  it('should display active light theme and badge when theme is light', () => {
    expect(element.textContent).toContain('Light theme is active');
    const badge = element.querySelector('[hlmbadge]');
    expect(badge?.textContent?.trim().toLowerCase()).toBe('light');
  });

  it('should dispatch themeChanged with dark when toggleTheme is called in light mode', () => {
    component.toggleTheme();
    expect(dispatcher.dispatch).toHaveBeenCalledWith(themeChanged({ mode: 'dark' }));
  });

  it('should dispatch themeChanged with dark when Appearance button is clicked in light mode', () => {
    const appearanceBtn = element.querySelector<HTMLButtonElement>(
      'button[aria-label="Toggle theme"]',
    );
    expect(appearanceBtn).toBeTruthy();

    appearanceBtn?.click();
    expect(dispatcher.dispatch).toHaveBeenCalledWith(themeChanged({ mode: 'dark' }));
  });

  it('should dispatch themeChanged with light when Appearance button is clicked in dark mode', async () => {
    mockTheme.set('dark');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.textContent).toContain('Dark theme is active');

    const appearanceBtn = element.querySelector<HTMLButtonElement>(
      'button[aria-label="Toggle theme"]',
    );
    appearanceBtn?.click();
    expect(dispatcher.dispatch).toHaveBeenCalledWith(themeChanged({ mode: 'light' }));
  });
});
