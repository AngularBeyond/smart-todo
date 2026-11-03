import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { LucidePlus } from '@lucide/angular';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmBadge } from '@spartan-ng/helm/badge';

@Component({
  selector: 'app-todo-create-bar',
  standalone: true,
  imports: [LucidePlus, HlmButton, HlmInput, HlmBadge],
  templateUrl: './todo-create-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoCreateBarComponent {
  readonly isQuotaReached = input<boolean>(false);
  readonly quotaBadgeText = input<string>('0/40');
  readonly disabled = input<boolean>(false);
  readonly placeholder = input<string>('What needs your attention?');

  readonly create = output<string>();

  readonly text = signal<string>('');

  readonly canSubmit = computed(() => {
    return (
      !this.isQuotaReached() &&
      !this.disabled() &&
      this.text().trim().length > 0 &&
      this.text().trim().length <= 500
    );
  });

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.text.set(target?.value ?? '');
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;

    const trimmed = this.text().trim();
    this.create.emit(trimmed);
    this.text.set('');
  }
}
