import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import {
  LucideCircleAlert,
  LucideEye,
  LucideEyeOff,
  LucideKeyRound,
  LucideShield,
  LucideX,
} from '@lucide/angular';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { ChangePasswordRequest } from '../../models';

@Component({
  selector: 'app-change-password-form',
  imports: [
    FormField,
    LucideCircleAlert,
    LucideEye,
    LucideEyeOff,
    LucideKeyRound,
    LucideShield,
    LucideX,
    HlmButton,
    HlmInput,
    HlmAlertImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './change-password-form.css',
  templateUrl: './change-password-form.html',
})
export class ChangePasswordFormComponent {
  readonly isLoading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly success = input<boolean>(false);

  readonly changePassword = output<ChangePasswordRequest>();
  readonly clearStatus = output<void>();

  readonly showCurrent = signal<boolean>(false);
  readonly showNew = signal<boolean>(false);
  readonly showConfirm = signal<boolean>(false);
  readonly mismatchError = signal<string | null>(null);

  readonly model = signal({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  readonly passwordForm = form(this.model, (schemaPath) => {
    required(schemaPath.currentPassword, { message: 'Current password is required.' });
    required(schemaPath.newPassword, { message: 'New password is required.' });
    minLength(schemaPath.newPassword, 8, {
      message: 'New password must be at least 8 characters.',
    });
    required(schemaPath.confirmPassword, {
      message: 'Password confirmation is required.',
    });
  });

  constructor() {
    effect(() => {
      if (this.success()) {
        untracked(() => {
          this.model.set({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          this.passwordForm().reset();
          this.mismatchError.set(null);
        });
      }
    });
  }

  toggleShowCurrent(): void {
    this.showCurrent.update((v) => !v);
  }

  toggleShowNew(): void {
    this.showNew.update((v) => !v);
  }

  toggleShowConfirm(): void {
    this.showConfirm.update((v) => !v);
  }

  handleSubmit(event?: Event): void {
    event?.preventDefault();
    this.mismatchError.set(null);

    if (this.passwordForm().invalid()) {
      this.passwordForm().markAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.model();

    if (newPassword !== confirmPassword) {
      this.mismatchError.set('New passwords do not match.');
      return;
    }

    this.changePassword.emit({
      currentPassword,
      newPassword,
    });
  }
}
