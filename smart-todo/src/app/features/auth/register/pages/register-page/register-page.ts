import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideSparkles,
  LucideCheck,
  LucideEye,
  LucideEyeOff,
  LucideArrowRight,
  LucideAlertCircle,
  LucideX,
} from '@lucide/angular';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { RegisterStore } from '../../store/register.store';
import { INITIAL_REGISTER_FEATURES } from '../../constants';

@Component({
  selector: 'app-register-page',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    LucideSparkles,
    LucideCheck,
    LucideEye,
    LucideEyeOff,
    LucideArrowRight,
    LucideAlertCircle,
    LucideX,
    HlmButton,
    HlmInput,
    HlmAlertImports,
  ],
  providers: [RegisterStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './register-page.css',
  templateUrl: './register-page.html',
})
export class RegisterPage {
  protected readonly store = inject(RegisterStore);

  readonly registerForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(50)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  readonly features = INITIAL_REGISTER_FEATURES;

  handleSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const val = this.registerForm.getRawValue();
    // Parse single or double name if lastName is blank
    let firstName = val.name.trim();
    let lastName = val.lastName.trim();
    if (!lastName) {
      const parts = firstName.split(' ');
      if (parts.length > 1) {
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      } else {
        lastName = 'User';
      }
    }

    this.store.register({
      name: firstName,
      lastName,
      email: val.email.trim().toLowerCase(),
      password: val.password,
    });
  }
}

