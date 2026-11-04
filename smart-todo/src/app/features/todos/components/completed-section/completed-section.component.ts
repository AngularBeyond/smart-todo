import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  LucideChevronDown,
  LucideChevronRight,
  LucideLoader2,
} from '@lucide/angular';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { InfiniteScrollSentinelDirective } from '@ui';
import { TodoItem } from '../../models';
import { TodoItemRowComponent } from '../todo-item-row/todo-item-row.component';

@Component({
  selector: 'app-completed-section',
  standalone: true,
  imports: [
    LucideChevronDown,
    LucideChevronRight,
    LucideLoader2,
    HlmBadge,
    InfiniteScrollSentinelDirective,
    TodoItemRowComponent,
  ],
  templateUrl: './completed-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompletedSectionComponent {
  readonly completedTodos = input.required<TodoItem[]>();
  readonly completedCount = input.required<number>();
  readonly isExpanded = input<boolean>(false);
  readonly isLoading = input<boolean>(false);
  readonly hasMore = input<boolean>(false);

  readonly toggleExpand = output<void>();
  readonly toggleTodo = output<TodoItem>();
  readonly updateTodoText = output<{ todoId: string; text: string }>();
  readonly deleteTodo = output<TodoItem>();
  readonly loadMore = output<void>();

  onToggleExpand(): void {
    this.toggleExpand.emit();
  }

  onToggleTodo(todo: TodoItem): void {
    this.toggleTodo.emit(todo);
  }

  onUpdateText(todoId: string, text: string): void {
    this.updateTodoText.emit({ todoId, text });
  }

  onDeleteTodo(todo: TodoItem): void {
    this.deleteTodo.emit(todo);
  }

  onLoadMore(): void {
    this.loadMore.emit();
  }
}
