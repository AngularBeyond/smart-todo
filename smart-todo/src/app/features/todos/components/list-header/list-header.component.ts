import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideStar, LucideTrash2, LucidePencil } from '@lucide/angular';
import { TodoListSummary } from '@core';
import { AutoFocusDirective } from '@ui';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';

@Component({
  selector: 'app-list-header',
  standalone: true,
  imports: [
    FormsModule,
    LucideStar,
    LucideTrash2,
    LucidePencil,
    AutoFocusDirective,
    HlmButton,
    HlmInput,
    HlmBadge,
    HlmAlertDialogImports,
  ],
  templateUrl: './list-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListHeaderComponent {
  readonly list = input.required<TodoListSummary>();

  readonly renamed = output<string>();
  readonly starToggled = output<void>();
  readonly deleted = output<void>();

  readonly isEditingTitle = signal(false);
  readonly editingTitle = signal('');

  startEditing(): void {
    this.editingTitle.set(this.list().name);
    this.isEditingTitle.set(true);
  }

  cancelEditing(): void {
    this.isEditingTitle.set(false);
    this.editingTitle.set('');
  }

  saveTitle(): void {
    if (!this.isEditingTitle()) return;

    const trimmed = this.editingTitle().trim();
    if (trimmed.length >= 1 && trimmed.length <= 100 && trimmed !== this.list().name) {
      this.renamed.emit(trimmed);
    }
    this.cancelEditing();
  }

  onTitleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveTitle();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEditing();
    }
  }

  toggleStar(): void {
    this.starToggled.emit();
  }

  confirmDelete(ctx?: { close?: () => void }): void {
    ctx?.close?.();
    this.deleted.emit();
  }
}
