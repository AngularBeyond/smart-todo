import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
import { LoginStore } from '../../store/login.store';

@Component({
  selector: 'app-login-page',
  imports: [
    RouterLink,
    ReactiveFormsModule,
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
  providers: [LoginStore],
  styleUrl: './login-page.scss',
  templateUrl: './login-page.html',
})
export class LoginPage {
  protected readonly store = inject(LoginStore);

  readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly features = [
    'A focused home for every task',
    'Simple lists that keep you moving',
    'Progress you can actually feel',
  ];

  handleSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const val = this.loginForm.getRawValue();
    this.store.login({
      email: val.email.trim().toLowerCase(),
      password: val.password,
    });
  }
}

