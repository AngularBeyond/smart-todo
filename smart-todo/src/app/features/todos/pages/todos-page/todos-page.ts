import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucidePlus,
  LucideSearch,
  LucideTag,
  LucideMoreHorizontal,
  LucideGripVertical,
  LucideCircle,
  LucideCheck,
  LucideTrash2,
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
import { ListHeaderComponent } from '../../components';

@Component({
  selector: 'app-todos-page',
  imports: [
    FormsModule,
    LucidePlus,
    LucideSearch,
    LucideTag,
    LucideMoreHorizontal,
    LucideGripVertical,
    LucideCircle,
    LucideCheck,
    LucideTrash2,
    LucideChevronDown,
    LucideChevronRight,
    LucideCircleCheck,
    HlmButton,
    HlmBadge,
    HlmInput,
    ListHeaderComponent,
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
}
