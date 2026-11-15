import {
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  signal,
  untracked,
  ViewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounce, form, FormField } from '@angular/forms/signals';
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop';
import {
  LucideSearch,
  LucideLoader2,
  LucideX,
} from '@lucide/angular';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { Dispatcher } from '@ngrx/signals/events';
import {
  AppStore,
  deleteTodoList,
  renameTodoList,
  TodoListsStore,
  toggleStarTodoList,
} from '@core';
import { AutoFocusDirective, HlmTooltip, InfiniteScrollSentinelDirective } from '@ui';
import { TodosStore } from '../../store/todos.store';
import {
  CompletedSectionComponent,
  ListHeaderComponent,
  TodoCreateBarComponent,
  TodoItemRowComponent,
} from '../../components';
import { TodoItem } from '../../models';

@Component({
  selector: 'app-todos-page',
  imports: [
    DatePipe,
    FormField,
    FormsModule,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    LucideSearch,
    LucideLoader2,
    LucideX,
    HlmBadge,
    HlmButton,
    HlmInput,
    HlmTooltip,
    AutoFocusDirective,
    InfiniteScrollSentinelDirective,
    ListHeaderComponent,
    TodoCreateBarComponent,
    TodoItemRowComponent,
    CompletedSectionComponent,
  ],
  providers: [TodosStore],
  styleUrl: './todos-page.scss',
  templateUrl: './todos-page.html',
})
export class TodosPage {
  @ViewChild('filterInput') filterInputRef?: ElementRef<HTMLInputElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly queryParams = toSignal(this.route.queryParamMap);
  readonly currentView = computed(() => this.queryParams()?.get('view'));
  readonly isAllTasks = computed(() => this.currentView() === 'all');
  readonly isStarredTasks = computed(() => this.currentView() === 'starred');
  readonly isAggregateView = computed(() => this.isAllTasks() || this.isStarredTasks());

  protected readonly store = inject(TodosStore);
  protected readonly todoListsStore = inject(TodoListsStore);
  protected readonly appStore = inject(AppStore);

  readonly currentDate = new Date();
  protected readonly dispatcher = inject(Dispatcher);

  private lastSelectedListId: string | null = null;

  readonly searchModel = signal({ query: '' });
  readonly isSearchOpen = signal(false);
  readonly searchForm = form(this.searchModel, (s) => {
    debounce(s.query, 400);
  });

  constructor() {
    effect(() => {
      const q = this.searchModel().query;
      untracked(() => {
        this.store.setQuery(q);
      });
    });

    effect(() => {
      if (this.isStarredTasks()) {
        if (this.lastSelectedListId !== 'starred') {
          this.lastSelectedListId = 'starred';
          this.searchModel.set({ query: '' });
          this.store.loadInitialStarredTodos();
        }
        return;
      }

      if (this.isAllTasks()) {
        if (this.lastSelectedListId !== 'all') {
          this.lastSelectedListId = 'all';
          this.searchModel.set({ query: '' });
          this.store.loadInitialAllTodos();
        }
        return;
      }

      const selected = this.todoListsStore.selectedList();
      if (!selected) {
        this.lastSelectedListId = null;
        this.searchModel.set({ query: '' });
        this.store.resetForNewList();
        return;
      }

      if (this.lastSelectedListId !== selected.id) {
        this.lastSelectedListId = selected.id;
        this.searchModel.set({ query: '' });
        this.store.loadInitialForList(selected.id);
      }
    });
  }

  clearSearch(): void {
    this.searchModel.set({ query: '' });
    this.store.clearSearch();
  }

  toggleSearch(): void {
    const next = !this.isSearchOpen();
    this.isSearchOpen.set(next);
    if (!next) {
      this.clearSearch();
    } else {
      setTimeout(() => {
        this.filterInputRef?.nativeElement?.focus();
      });
    }
  }

  onSearchEscape(): void {
    if (this.searchModel().query) {
      this.clearSearch();
    } else {
      this.isSearchOpen.set(false);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    if (
      event.key === '/' &&
      (event.target as HTMLElement)?.tagName !== 'INPUT' &&
      (event.target as HTMLElement)?.tagName !== 'TEXTAREA'
    ) {
      event.preventDefault();
      if (!this.isSearchOpen()) {
        this.isSearchOpen.set(true);
      }
      setTimeout(() => {
        this.filterInputRef?.nativeElement?.focus();
      });
    }
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

  onToggleCompletedSection(): void {
    this.store.toggleCompletedSection();
  }

  onLoadMoreActive(): void {
    this.store.loadMoreActiveTodos();
  }

  onLoadMoreCompleted(): void {
    this.store.loadMoreCompletedTodos();
  }

  onDropActive(event: CdkDragDrop<TodoItem[]>): void {
    if (this.isAggregateView() || event.previousIndex === event.currentIndex) return;

    const activeList = this.store.visibleActiveTodos();
    const item = activeList[event.previousIndex];
    if (!item) return;

    this.store.reorderActiveTodo({
      todoId: item.id,
      targetIndex: event.currentIndex,
    });
  }
}

