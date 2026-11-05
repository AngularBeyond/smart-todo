import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
import { AppStore, themeChanged, toggleMobileSidebar, userLogout } from '@core';
import { Header } from './header';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let component: Header;
  let element: HTMLElement;
  let dispatcher: Dispatcher;

  const mockTheme = signal<'light' | 'dark'>('light');
  const mockUserInitials = signal('JD');
  const mockUserDisplayName = signal('Jordan Davis');
  const mockProfile = signal({ id: 'u-1', email: 'jordan@example.com', name: 'Jordan', lastName: 'Davis' });

  const mockAppStore = {
    theme: mockTheme.asReadonly(),
    userInitials: mockUserInitials.asReadonly(),
    userDisplayName: mockUserDisplayName.asReadonly(),
    profile: mockProfile.asReadonly(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        provideDispatcher(),
        { provide: AppStore, useValue: mockAppStore },
      ],
    }).compileComponents();

    dispatcher = TestBed.inject(Dispatcher);
    vi.spyOn(dispatcher, 'dispatch');

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create header component', () => {
    expect(component).toBeTruthy();
  });

  it('should render brand logo, title, and agentic slogan', () => {
    expect(element.textContent).toContain('Smart Todo');
    expect(element.textContent).toContain('Your tasks, orchestrated by agents.');
  });

  it('should dispatch toggleMobileSidebar when hamburger button is clicked', () => {
    const hamburgerBtn = element.querySelector<HTMLButtonElement>('button[aria-label="Open sidebar"]');
    expect(hamburgerBtn).toBeTruthy();

    hamburgerBtn?.click();
    expect(dispatcher.dispatch).toHaveBeenCalledWith(toggleMobileSidebar());
  });

  it('should dispatch themeChanged when theme toggle is clicked', () => {
    component.toggleTheme();
    expect(dispatcher.dispatch).toHaveBeenCalledWith(themeChanged({ mode: 'dark' }));
  });

  it('should toggle and close avatar dropdown card', () => {
    expect(component.showDropdown()).toBe(false);
    component.toggleDropdown();
    expect(component.showDropdown()).toBe(true);
    fixture.detectChanges();

    expect(element.textContent).toContain('Jordan Davis');
    expect(element.textContent).toContain('jordan@example.com');

    component.closeDropdown();
    expect(component.showDropdown()).toBe(false);
  });

  it('should dispatch userLogout when logout is called', () => {
    component.logout();
    expect(dispatcher.dispatch).toHaveBeenCalledWith(userLogout());
    expect(component.showDropdown()).toBe(false);
  });

  it('should open dropdown on mouse enter and close after 2000ms on mouse leave', () => {
    vi.useFakeTimers();
    try {
      expect(component.showDropdown()).toBe(false);

      component.onMouseEnter();
      expect(component.showDropdown()).toBe(true);

      component.onMouseLeave();
      // Dropdown remains open before 2 seconds
      vi.advanceTimersByTime(1999);
      expect(component.showDropdown()).toBe(true);

      // Closes at 2000ms
      vi.advanceTimersByTime(1);
      expect(component.showDropdown()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should cancel close timer if re-entering before 2000ms', () => {
    vi.useFakeTimers();
    try {
      component.onMouseEnter();
      expect(component.showDropdown()).toBe(true);

      component.onMouseLeave();
      vi.advanceTimersByTime(1000);
      expect(component.showDropdown()).toBe(true);

      // Re-enter before 2000ms expires
      component.onMouseEnter();
      vi.advanceTimersByTime(2000);
      expect(component.showDropdown()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should render bot button before theme toggle button', () => {
    const buttons = Array.from(element.querySelectorAll<HTMLButtonElement>('button'));
    const botBtnIndex = buttons.findIndex((b) => b.getAttribute('aria-label') === 'Agentic assistant');
    const themeBtnIndex = buttons.findIndex((b) => b.getAttribute('aria-label') === 'Toggle theme');

    expect(botBtnIndex).toBeGreaterThan(-1);
    expect(themeBtnIndex).toBeGreaterThan(-1);
    expect(botBtnIndex).toBeLessThan(themeBtnIndex);
  });
});
