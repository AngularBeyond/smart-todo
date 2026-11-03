import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideInbox,
  LucideStar,
  LucideArchive,
  LucidePlus,
  LucideUser,
  LucideSettings2,
  LucideLogOut,
} from '@lucide/angular';
import { Dispatcher } from '@ngrx/signals/events';
import {
  createTodoList,
  loadTodoLists,
  selectTodoList,
  toggleStarTodoList,
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
    LucideInbox,
    LucideStar,
    LucideArchive,
    LucidePlus,
    LucideUser,
    LucideSettings2,
    LucideLogOut,
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
