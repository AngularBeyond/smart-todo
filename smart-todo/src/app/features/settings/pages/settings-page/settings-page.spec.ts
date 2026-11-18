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
    expect(element.textContent).toContain('Reminders and daily progress updates');
    expect(element.textContent).toContain('Preferred theme');
    expect(element.textContent).toContain('Customize your workspace theme and appearance');
    expect(element.textContent).not.toContain('Start of week');
    expect(element.textContent).not.toContain('Privacy & security');
    expect(element.textContent).not.toContain('Account security');
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

  it('should render task defaults card with allowed lists limit, daily task limit indicator, and save button', () => {
    expect(element.textContent).toContain('Task defaults');
    expect(element.textContent).toContain('Keep new tasks quick, structured, and consistent.');
    expect(element.textContent).toContain('Number of allowed lists');
    expect(element.textContent).toContain('Maximum lists in workspace');
    expect(element.textContent).toContain('3 lists');
    expect(element.textContent).toContain('Maximum quota allowed is 3 lists per account.');
    expect(element.textContent).not.toContain('Default list');
    expect(element.textContent).toContain('Daily task limit');
    expect(element.textContent).toContain('Active capacity cap per list');
    expect(element.textContent).toContain('40 tasks');
    expect(element.textContent).toContain('Maximum quota allowed is 40 tasks per list.');
    expect(element.textContent).toContain('Preferences saved');
  });

  it('should not render configurable buttons for list limit or daily task limit', () => {
    const buttons = element.querySelectorAll<HTMLButtonElement>('button[type="button"]');
    const buttonTexts = Array.from(buttons).map((b) => b.textContent?.trim());
    expect(buttonTexts).not.toContain('Personal');
    expect(buttonTexts).not.toContain('10');
  });

  it('should mark saved when Preferences saved button is clicked', () => {
    const saveBtn = Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes('Preferences saved'),
    );

    expect(saveBtn).toBeTruthy();
    const markSavedSpy = vi.spyOn((component as any).store, 'markSaved');
    saveBtn?.click();
    expect(markSavedSpy).toHaveBeenCalled();
  });
});
