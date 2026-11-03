import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import {
  LucideInbox,
  LucideStar,
  LucideArchive,
  LucidePlus,
  LucideUser,
  LucideSettings2,
  LucideLogOut,
  LucideGripVertical,
} from '@lucide/angular';
import { Dispatcher } from '@ngrx/signals/events';
import {
  createTodoList,
  loadTodoLists,
  reorderUnstarredList,
  selectTodoList,
  toggleStarTodoList,
  TodoListSummary,
  TodoListsStore,
  userLogout,
} from '@core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSeparator } from '@spartan-ng/helm/separator';

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    FormsModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    LucideInbox,
    LucideStar,
    LucideArchive,
    LucidePlus,
    LucideUser,
    LucideSettings2,
    LucideLogOut,
    LucideGripVertical,
    HlmButton,
    HlmBadge,
    HlmInput,
    HlmSeparator,
  ],
  host: {
    class: 'flex shrink-0',
  },
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar implements OnInit {
  protected readonly dispatcher = inject(Dispatcher);
  protected readonly todoListsStore = inject(TodoListsStore);

  readonly variant = input<'desktop' | 'mobile'>('desktop');
  readonly newListName = signal('');

  ngOnInit(): void {
    if (this.todoListsStore.lists().length === 0) {
      this.dispatcher.dispatch(loadTodoLists());
    }
  }

  selectList(listId: string): void {
    this.dispatcher.dispatch(selectTodoList({ listId }));
  }

  toggleStar(listId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.dispatcher.dispatch(toggleStarTodoList({ listId }));
  }

  onDrop(event: CdkDragDrop<TodoListSummary[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const unstarred = this.todoListsStore.unstarredLists();
    const item = unstarred[event.previousIndex];
    if (!item) {
      return;
    }
    this.dispatcher.dispatch(
      reorderUnstarredList({
        listId: item.id,
        targetIndex: event.currentIndex,
      }),
    );
  }

  createList(): void {
    const name = this.newListName().trim();
    if (!name || this.todoListsStore.isQuotaReached()) return;
    this.dispatcher.dispatch(createTodoList({ name }));
    this.newListName.set('');
  }

  logout(): void {
    this.dispatcher.dispatch(userLogout());
  }
}
