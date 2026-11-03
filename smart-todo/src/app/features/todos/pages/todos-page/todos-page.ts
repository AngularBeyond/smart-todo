import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import {
  LucideSearch,
  LucideTag,
  LucideMoreHorizontal,
  LucideChevronDown,
  LucideChevronRight,
  LucideCircleCheck,
} from '@lucide/angular';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmInput } from '@spartan-ng/helm/input';
import { Dispatcher } from '@ngrx/signals/events';
import {
  AppStore,
  deleteTodoList,
  renameTodoList,
  TodoListsStore,
  toggleStarTodoList,
} from '@core';
import { TodosStore } from '../../store/todos.store';
import {
  ListHeaderComponent,
  TodoCreateBarComponent,
  TodoItemRowComponent,
} from '../../components';
import { TodoItem } from '../../models';

@Component({
  selector: 'app-todos-page',
  imports: [
    FormsModule,
    CdkDropList,
    CdkDrag,
    LucideSearch,
    LucideTag,
    LucideMoreHorizontal,
    LucideChevronDown,
    LucideChevronRight,
    LucideCircleCheck,
    HlmButton,
    HlmBadge,
    HlmInput,
    ListHeaderComponent,
    TodoCreateBarComponent,
    TodoItemRowComponent,
  ],
  providers: [TodosStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './todos-page.css',
  templateUrl: './todos-page.html',
})
export class TodosPage {
  protected readonly store = inject(TodosStore);
  protected readonly todoListsStore = inject(TodoListsStore);
  protected readonly appStore = inject(AppStore);
  protected readonly dispatcher = inject(Dispatcher);

  private lastSelectedListId: string | null = null;

  constructor() {
    effect(() => {
      const selected = this.todoListsStore.selectedList();
      if (!selected) return;

      if (this.lastSelectedListId !== selected.id) {
        this.lastSelectedListId = selected.id;
        if (selected.totalCount === 0) {
          this.store.resetForNewList(selected.name);
        }
      }
    });
  }

  onRenameList(listId: string, name: string): void {
    this.dispatcher.dispatch(renameTodoList({ listId, name }));
  }

  onToggleStar(listId: string): void {
    this.dispatcher.dispatch(toggleStarTodoList({ listId }));
  }

  onDeleteList(listId: string): void {
    this.dispatcher.dispatch(deleteTodoList({ listId }));
  }

  onCreateTodo(text: string): void {
    this.store.createTodo({ text });
  }

  onToggleComplete(todo: TodoItem): void {
    this.store.toggleTodoCompletion(todo);
  }

  onUpdateText(todoId: string, text: string): void {
    this.store.updateTodoText({ todoId, text });
  }

  onDeleteTodo(todo: TodoItem): void {
    this.store.deleteTodo(todo);
  }

  onDropActive(event: CdkDragDrop<TodoItem[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const activeList = this.store.visibleActiveTodos();
    const item = activeList[event.previousIndex];
    if (!item) return;

    this.store.reorderActiveTodo({
      todoId: item.id,
      targetIndex: event.currentIndex,
    });
  }
}

