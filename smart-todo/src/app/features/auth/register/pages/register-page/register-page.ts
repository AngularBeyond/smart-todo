import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  form,
  FormField,
  submit,
  required,
  email as emailValidator,
  minLength,
  maxLength,
} from '@angular/forms/signals';
import {
  LucideSparkles,
  LucideCheck,
  LucideEye,
  LucideEyeOff,
  LucideArrowRight,
  LucideCircleAlert,
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
    FormField,
    LucideSparkles,
    LucideCheck,
    LucideEye,
    LucideEyeOff,
    LucideArrowRight,
    LucideCircleAlert,
    LucideX,
    HlmButton,
    HlmInput,
    HlmAlertImports,
  ],
  providers: [RegisterStore],
  styleUrl: './register-page.css',
  templateUrl: './register-page.html',
})
export class RegisterPage {
  protected readonly store = inject(RegisterStore);

  readonly registerModel = signal({
    name: '',
    lastName: '',
    email: '',
    password: '',
  });

  readonly registerForm = form(this.registerModel, (schemaPath) => {
    required(schemaPath.name, { message: 'First name is required.' });
    maxLength(schemaPath.name, 50, { message: 'First name must not exceed 50 characters.' });

    maxLength(schemaPath.lastName, 50, { message: 'Last name must not exceed 50 characters.' });

    required(schemaPath.email, { message: 'Email is required.' });
    emailValidator(schemaPath.email, { message: 'Please enter a valid email address.' });

    required(schemaPath.password, { message: 'Password is required.' });
    minLength(schemaPath.password, 8, { message: 'Password must be at least 8 characters.' });
  });

  readonly features = INITIAL_REGISTER_FEATURES;

  handleSubmit(event?: Event): void {
    event?.preventDefault();
    void submit(this.registerForm, () => {
      const val = this.registerModel();
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

      return Promise.resolve();
    });
  }
}

