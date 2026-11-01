import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { RegisterPage } from './register-page';
import { RegisterStore } from '../../store/register.store';

describe('RegisterPage with Signal Forms', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let component: RegisterPage;
  let element: HTMLElement;

  let storeMock: {
    error: ReturnType<typeof signal<string | null>>;
    isPending: ReturnType<typeof signal<boolean>>;
    showPassword: ReturnType<typeof signal<boolean>>;
    clearError: ReturnType<typeof vi.fn>;
    toggleShowPassword: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    storeMock = {
      error: signal<string | null>(null),
      isPending: signal<boolean>(false),
      showPassword: signal<boolean>(false),
      clearError: vi.fn(),
      toggleShowPassword: vi.fn(() => storeMock.showPassword.update((val) => !val)),
      register: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideRouter([])],
    })
      .overrideComponent(RegisterPage, {
        set: {
          providers: [{ provide: RegisterStore, useValue: storeMock }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should not display validation errors on initial render', () => {
    const errorElements = element.querySelectorAll('p.text-destructive');
    expect(errorElements.length).toBe(0);

    const nameInput = element.querySelector<HTMLInputElement>('#name');
    expect(nameInput?.getAttribute('data-matches-spartan-invalid')).toBeNull();
  });

  it('should display error message and mark input invalid on blur when first name is empty', async () => {
    const nameInput = element.querySelector<HTMLInputElement>('#name');
    expect(nameInput).toBeTruthy();

    nameInput?.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.registerForm.name().touched()).toBe(true);
    expect(nameInput?.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const errorParagraph = element.querySelector('p.text-destructive');
    expect(errorParagraph?.textContent?.trim()).toBe('First name is required.');
  });

  it('should display error message on blur when email is invalid', async () => {
    const emailInput = element.querySelector<HTMLInputElement>('#email');
    expect(emailInput).toBeTruthy();

    component.registerModel.update((m) => ({ ...m, email: 'invalid-email' }));
    emailInput?.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.registerForm.email().touched()).toBe(true);
    expect(emailInput?.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const emailError = Array.from(element.querySelectorAll('p.text-destructive')).find((p) =>
      p.textContent?.includes('Please enter a valid email address.')
    );
    expect(emailError).toBeTruthy();
  });

  it('should display error message on blur when password has fewer than 8 characters', async () => {
    const passwordInput = element.querySelector<HTMLInputElement>('#password');
    expect(passwordInput).toBeTruthy();

    component.registerModel.update((m) => ({ ...m, password: 'short' }));
    passwordInput?.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.registerForm.password().touched()).toBe(true);
    expect(passwordInput?.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const passwordError = Array.from(element.querySelectorAll('p.text-destructive')).find((p) =>
      p.textContent?.includes('Password must be at least 8 characters.')
    );
    expect(passwordError).toBeTruthy();
  });

  it('should mark fields as touched and prevent register call when submitting invalid form', async () => {
    const formEl = element.querySelector('form');
    expect(formEl).toBeTruthy();

    formEl?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.registerForm.name().touched()).toBe(true);
    expect(component.registerForm.email().touched()).toBe(true);
    expect(component.registerForm.password().touched()).toBe(true);
    expect(storeMock.register).not.toHaveBeenCalled();

    const errors = element.querySelectorAll('p.text-destructive');
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  it('should call store.register with valid credentials when submitting valid form', async () => {
    component.registerModel.set({
      name: 'Jordan',
      lastName: 'Davis',
      email: 'Jordan.Davis@example.com',
      password: 'validPassword123',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const formEl = element.querySelector('form');
    formEl?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(storeMock.register).toHaveBeenCalledWith({
      name: 'Jordan',
      lastName: 'Davis',
      email: 'jordan.davis@example.com',
      password: 'validPassword123',
    });
  });

  it('should split full name if last name is omitted on submit', async () => {
    component.registerModel.set({
      name: 'Taylor Swift',
      lastName: '',
      email: 'taylor@example.com',
      password: 'password123',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const formEl = element.querySelector('form');
    formEl?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(storeMock.register).toHaveBeenCalledWith({
      name: 'Taylor',
      lastName: 'Swift',
      email: 'taylor@example.com',
      password: 'password123',
    });
  });

  it('should toggle password visibility when button clicked', async () => {
    const passwordInput = element.querySelector<HTMLInputElement>('#password');
    expect(passwordInput?.type).toBe('password');

    const toggleBtn = element.querySelector<HTMLButtonElement>('button[aria-label="Show password"]');
    expect(toggleBtn).toBeTruthy();

    toggleBtn?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(storeMock.toggleShowPassword).toHaveBeenCalled();
    expect(passwordInput?.type).toBe('text');
  });

  it('should display error alert when store.error has value and dismiss it on button click', async () => {
    storeMock.error.set('Registration failed: Email already in use');
    fixture.detectChanges();
    await fixture.whenStable();

    const alertEl = element.querySelector('[hlmAlert]');
    expect(alertEl).toBeTruthy();
    expect(alertEl?.textContent).toContain('Registration failed: Email already in use');

    const dismissBtn = element.querySelector<HTMLButtonElement>('button[aria-label="Dismiss error"]');
    dismissBtn?.click();
    expect(storeMock.clearError).toHaveBeenCalled();
  });
});
