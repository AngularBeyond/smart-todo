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
  LucideMail,
  LucideMoon,
  LucideSun,
  LucideUserRound,
} from '@lucide/angular';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { UserProfile } from '@core';
import { UpdateProfileRequest } from '../../models';

@Component({
  selector: 'app-profile-form',
  imports: [
    FormField,
    LucideMail,
    LucideMoon,
    LucideSun,
    LucideUserRound,
    HlmButton,
    HlmInput,
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

  readonly currentTheme = input<'light' | 'dark'>('light');
  readonly save = output<UpdateProfileRequest>();
  readonly themeChange = output<'light' | 'dark'>();
  readonly clearStatus = output<void>();

  readonly model = signal<{
    name: string;
    lastName: string;
  }>({
    name: '',
    lastName: '',
  });

  readonly profileForm = form(this.model, (schemaPath) => {
    maxLength(schemaPath.name, 50, { message: 'First name must not exceed 50 characters.' });
    maxLength(schemaPath.lastName, 50, { message: 'Last name must not exceed 50 characters.' });
  });

  constructor() {
    effect(() => {
      const p = this.profile();
      untracked(() => {
        this.model.update((current) => ({
          name: p?.name ?? current.name,
          lastName: p?.lastName ?? current.lastName,
        }));
        this.profileForm().reset();
      });
    });
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.themeChange.emit(theme);
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
    });
  }
}
