import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucidePencil, LucideSearch, LucideStar, LucideTrash } from '@lucide/angular';
import { TodoListSummary } from '@core';
import { AutoFocusDirective, HlmTooltip } from '@ui';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';

@Component({
  selector: 'app-list-header',
  imports: [
    FormsModule,
    LucidePencil,
    LucideSearch,
    LucideStar,
    LucideTrash,
    AutoFocusDirective,
    HlmButton,
    HlmInput,
    HlmBadge,
    HlmTooltip,
    HlmAlertDialogImports,
  ],
  templateUrl: './list-header.component.html',
})
export class ListHeaderComponent {
  readonly list = input.required<TodoListSummary>();
  readonly isSearchOpen = input<boolean>(false);

  readonly renamed = output<string>();
  readonly toggleStar = output<void>();
  readonly toggleSearch = output<void>();
  readonly deleteList = output<void>();

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
}
