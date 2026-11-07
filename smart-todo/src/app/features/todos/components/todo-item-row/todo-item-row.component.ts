import {
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import {
  LucideGripVertical,
  LucideCheck,
  LucideCircle,
  LucideTrash,
} from '@lucide/angular';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { AutoFocusDirective } from '@ui';
import { TodoItem } from '../../models';
import { formatTodoMetadata, highlightText } from '../../pure-functions';

@Component({
  selector: 'app-todo-item-row',
  imports: [
    FormsModule,
    CdkDragHandle,
    LucideGripVertical,
    LucideCheck,
    LucideCircle,
    LucideTrash,
    HlmButton,
    HlmInput,
    AutoFocusDirective,
  ],
  templateUrl: './todo-item-row.component.html',
  styleUrl: './todo-item-row.component.scss',
  host: {
    class: 'block',
  },
})
export class TodoItemRowComponent {
  readonly todo = input.required<TodoItem>();
  readonly isDraggable = input<boolean>(true);
  readonly searchQuery = input<string>('');

  readonly toggleComplete = output<void>();
  readonly textUpdated = output<string>();
  readonly deleteClicked = output<void>();

  readonly isEditing = signal(false);
  readonly editText = signal('');

  readonly metadataText = computed(() => {
    const item = this.todo();
    return formatTodoMetadata(item.createdAt, item.updatedAt);
  });

  readonly textSegments = computed(() => {
    return highlightText(this.todo().text, this.searchQuery());
  });

  startEditing(): void {
    if (this.todo().isCompleted) return;
    this.editText.set(this.todo().text);
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.editText.set('');
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.editText.set(target?.value ?? '');
  }

  saveEdit(): void {
    if (!this.isEditing()) return;

    const trimmed = this.editText().trim();
    if (trimmed.length >= 1 && trimmed.length <= 500 && trimmed !== this.todo().text) {
      this.textUpdated.emit(trimmed);
    }
    this.cancelEditing();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEditing();
    }
  }

  onToggleComplete(): void {
    this.toggleComplete.emit();
  }

  onDelete(): void {
    this.deleteClicked.emit();
  }
}
