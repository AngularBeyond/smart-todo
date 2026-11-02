import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
import { userLogout } from '@core';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let fixture: ComponentFixture<Sidebar>;
  let component: Sidebar;
  let element: HTMLElement;
  let dispatcher: Dispatcher;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([]), provideDispatcher()],
    }).compileComponents();

    dispatcher = TestBed.inject(Dispatcher);
    vi.spyOn(dispatcher, 'dispatch');

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render Profile link pointing to /profile and not render Tags link', () => {
    const profileLink = element.querySelector<HTMLAnchorElement>('a[routerLink="/profile"]');
    expect(profileLink).toBeTruthy();
    expect(profileLink?.textContent).toContain('Profile');

    const tagsLink = element.querySelector<HTMLAnchorElement>('a[routerLink="/tags"]');
    expect(tagsLink).toBeNull();
  });

  it('should render Settings link pointing to /settings', () => {
    const settingsLink = element.querySelector<HTMLAnchorElement>('a[routerLink="/settings"]');
    expect(settingsLink).toBeTruthy();
    expect(settingsLink?.textContent).toContain('Settings');
  });

  it('should render Logout button and dispatch userLogout when clicked', () => {
    const logoutBtn = Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find((btn) =>
      btn.textContent?.includes('Logout'),
    );
    expect(logoutBtn).toBeTruthy();

    logoutBtn?.click();
    expect(dispatcher.dispatch).toHaveBeenCalledWith(userLogout());
  });

  it('should call dispatcher.dispatch with userLogout on logout() call', () => {
    component.logout();
    expect(dispatcher.dispatch).toHaveBeenCalledWith(userLogout());
  });
});
