import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideInbox,
  LucideStar,
  LucideArchive,
  LucideListPlus,
  LucidePlus,
  LucideTag,
  LucideSettings2,
} from '@lucide/angular';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSeparator } from '@spartan-ng/helm/separator';

export interface SidebarList {
  name: string;
  count: number;
  starred: boolean;
  color: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    FormsModule,
    LucideInbox,
    LucideStar,
    LucideArchive,
    LucideListPlus,
    LucidePlus,
    LucideTag,
    LucideSettings2,
    HlmButton,
    HlmBadge,
    HlmInput,
    HlmSeparator,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar {
  readonly activeList = signal('My Tasks');
  readonly newList = signal('');
  readonly lists = signal<SidebarList[]>([
    { name: 'My Tasks', count: 8, starred: true, color: 'bg-primary' },
    { name: 'Work sprint', count: 12, starred: true, color: 'bg-chart-2' },
    { name: 'Personal', count: 6, starred: false, color: 'bg-chart-3' },
  ]);

  selectList(name: string): void {
    this.activeList.set(name);
  }

  createList(): void {
    const name = this.newList().trim();
    if (!name || this.lists().length >= 3) return;
    this.lists.update((current) => [
      ...current,
      { name, count: 0, starred: false, color: 'bg-chart-5' },
    ]);
    this.newList.set('');
  }
}
