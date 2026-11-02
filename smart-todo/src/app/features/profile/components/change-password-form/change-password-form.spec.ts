import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ChangePasswordFormComponent } from './change-password-form';

@Component({
  imports: [ChangePasswordFormComponent],
  template: `
    <app-change-password-form
      [isLoading]="isLoading()"
      [error]="error()"
      [success]="success()"
      (changePassword)="onChangePassword($event)"
      (clearStatus)="onClearStatus()"
    />
  `,
})
class TestHostComponent {
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);

  lastPayload: unknown = null;
  cleared = false;

  onChangePassword(payload: unknown): void {
    this.lastPayload = payload;
  }

  onClearStatus(): void {
    this.cleared = true;
  }
}

describe('ChangePasswordFormComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should render form without any validation errors initially', () => {
    const errors = element.querySelectorAll('p.text-destructive');
    expect(errors.length).toBe(0);

    const inputs = element.querySelectorAll<HTMLInputElement>('input');
    inputs.forEach((input) => {
      expect(input.getAttribute('data-matches-spartan-invalid')).toBeNull();
    });
  });

  it('should display validation errors when submitting an empty form', async () => {
    const form = element.querySelector('form');
    form?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();

    const errors = element.querySelectorAll('p.text-destructive');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reset form values, clear touched state, and not show validation errors after success', async () => {
    // 1. Fill in valid password inputs
    const inputs = element.querySelectorAll<HTMLInputElement>('input');
    const currentInput = inputs[0];
    const newInput = inputs[1];
    const confirmInput = inputs[2];

    currentInput.value = 'old-password';
    currentInput.dispatchEvent(new Event('input'));
    newInput.value = 'new-password-123';
    newInput.dispatchEvent(new Event('input'));
    confirmInput.value = 'new-password-123';
    confirmInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();
    await fixture.whenStable();

    // 2. Submit form
    const form = element.querySelector('form');
    form?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.lastPayload).toEqual({
      currentPassword: 'old-password',
      newPassword: 'new-password-123',
    });

    // 3. Mark success as true (simulating successful API response)
    host.success.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    // 4. Verify fields are empty
    expect(currentInput.value).toBe('');
    expect(newInput.value).toBe('');
    expect(confirmInput.value).toBe('');

    // 5. Verify NO validation error messages or invalid attributes appear
    const errors = element.querySelectorAll('p.text-destructive');
    expect(errors.length).toBe(0);

    inputs.forEach((input) => {
      expect(input.getAttribute('data-matches-spartan-invalid')).toBeNull();
    });

    // 6. Verify success banner is visible
    expect(element.textContent).toContain('Password updated');
  });
});
