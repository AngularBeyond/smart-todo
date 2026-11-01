import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { RegisterStore } from '../../store/register.store';
import { INITIAL_REGISTER_FEATURES } from '../../constants';

@Component({
  selector: 'app-register-page',
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
  providers: [RegisterStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './register-page.css',
  templateUrl: './register-page.html',
})
export class RegisterPage {
  protected readonly store = inject(RegisterStore);

  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');

  readonly features = INITIAL_REGISTER_FEATURES;

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.store.setSubmitted(true);
  }
}
