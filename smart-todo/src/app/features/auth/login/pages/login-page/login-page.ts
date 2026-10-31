import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideSparkles,
  LucideCheck,
  LucideEye,
  LucideEyeOff,
  LucideArrowRight,
} from '@lucide/angular';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { LoginStore } from '../../store/login.store';

@Component({
  selector: 'app-login-page',
  imports: [
    RouterLink,
    FormsModule,
    LucideSparkles,
    LucideCheck,
    LucideEye,
    LucideEyeOff,
    LucideArrowRight,
    HlmButton,
    HlmInput,
  ],
  providers: [LoginStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './login-page.css',
  templateUrl: './login-page.html',
})
export class LoginPage {
  protected readonly store = inject(LoginStore);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');

  readonly features = [
    'A focused home for every task',
    'Simple lists that keep you moving',
    'Progress you can actually feel',
  ];

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.store.setSubmitted(true);
  }
}
