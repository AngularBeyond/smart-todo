import {
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
  LucideMail,
  LucideUserRound,
} from '@lucide/angular';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { UserProfile } from '@core';
import { UpdateProfileRequest } from '../../models';

@Component({
  selector: 'app-profile-form',
  imports: [
    FormField,
    LucideCheck,
    LucideMail,
    LucideUserRound,
    HlmButton,
    HlmInput,
    HlmAlertImports,
  ],
  styleUrl: './profile-form.scss',
  templateUrl: './profile-form.html',
})
export class ProfileFormComponent {
  readonly profile = input<UserProfile | null>(null);
  readonly isLoading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly success = input<boolean>(false);

  readonly save = output<UpdateProfileRequest>();
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
