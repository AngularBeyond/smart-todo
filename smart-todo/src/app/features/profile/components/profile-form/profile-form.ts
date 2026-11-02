import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { form, FormField, maxLength } from '@angular/forms/signals';
import {
  LucideCheck,
  LucideCircleAlert,
  LucideMail,
  LucideMoon,
  LucideSun,
  LucideUserRound,
  LucideX,
} from '@lucide/angular';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { UserProfile } from '@core';
import { PROFILE_CONSTANTS } from '../../constants';
import { UpdateProfileRequest } from '../../models';

@Component({
  selector: 'app-profile-form',
  imports: [
    FormField,
    LucideCheck,
    LucideCircleAlert,
    LucideMail,
    LucideMoon,
    LucideSun,
    LucideUserRound,
    LucideX,
    HlmButton,
    HlmInput,
    HlmAlertImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './profile-form.css',
  templateUrl: './profile-form.html',
})
export class ProfileFormComponent {
  readonly profile = input<UserProfile | null>(null);
  readonly isLoading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly success = input<boolean>(false);

  readonly save = output<UpdateProfileRequest>();
  readonly clearStatus = output<void>();

  protected readonly successMessage = PROFILE_CONSTANTS.PROFILE_SAVED_SUCCESS;

  readonly model = signal<{
    name: string;
    lastName: string;
    preferredTheme: 'light' | 'dark';
  }>({
    name: '',
    lastName: '',
    preferredTheme: 'light',
  });

  readonly profileForm = form(this.model, (schemaPath) => {
    maxLength(schemaPath.name, 50, { message: 'First name must not exceed 50 characters.' });
    maxLength(schemaPath.lastName, 50, { message: 'Last name must not exceed 50 characters.' });
  });

  constructor() {
    effect(() => {
      const p = this.profile();
      if (p) {
        untracked(() => {
          this.model.set({
            name: p.name ?? '',
            lastName: p.lastName ?? '',
            preferredTheme: p.preferredTheme ?? 'light',
          });
          this.profileForm().reset();
        });
      }
    });
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.model.update((current) => ({ ...current, preferredTheme: theme }));
  }

  handleSubmit(event?: Event): void {
    event?.preventDefault();
    if (this.profileForm().invalid()) {
      this.profileForm().markAsTouched();
      return;
    }

    const val = this.model();
    this.save.emit({
      name: val.name.trim(),
      lastName: val.lastName.trim(),
      preferredTheme: val.preferredTheme,
    });
  }
}
