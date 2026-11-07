import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { UserProfile } from '@core';
import { ProfileFormComponent } from './profile-form';
import { UpdateProfileRequest } from '../../models';

@Component({
  imports: [ProfileFormComponent],
  template: `
    <app-profile-form
      [profile]="profile()"
      [isLoading]="isLoading()"
      [error]="error()"
      [success]="success()"
      (save)="onSave($event)"
      (clearStatus)="onClearStatus()"
    />
  `,
})
class TestHostComponent {
  readonly profile = signal<UserProfile | null>({
    id: 'u-1',
    name: 'John',
    lastName: 'Smith',
    email: 'john@example.com',
  });
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);

  lastSavePayload: UpdateProfileRequest | null = null;
  cleared = false;

  onSave(payload: UpdateProfileRequest): void {
    this.lastSavePayload = payload;
  }

  onClearStatus(): void {
    this.cleared = true;
  }
}

describe('ProfileFormComponent', () => {
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

  it('should render form with initial profile details', () => {
    const nameInput = element.querySelector<HTMLInputElement>('#profile-name');
    const lastNameInput = element.querySelector<HTMLInputElement>('#profile-lastName');
    const emailInput = element.querySelector<HTMLInputElement>('#profile-email');

    expect(nameInput?.value).toBe('John');
    expect(lastNameInput?.value).toBe('Smith');
    expect(emailInput?.value).toBe('john@example.com');
  });

  it('should not render preferred theme section in profile form', () => {
    expect(element.textContent).not.toContain('Preferred theme');
  });

  it('should emit save with updated profile data on submit', async () => {
    const nameInput = element.querySelector<HTMLInputElement>('#profile-name');
    if (nameInput) {
      nameInput.value = 'Johnny';
      nameInput.dispatchEvent(new Event('input'));
    }

    fixture.detectChanges();
    await fixture.whenStable();

    const form = element.querySelector('form');
    form?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.lastSavePayload).toEqual({
      name: 'Johnny',
      lastName: 'Smith',
    });
  });
});
