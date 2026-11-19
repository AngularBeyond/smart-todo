import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideBell,
  LucideChevronRight,
  LucideListTodo,
  LucideMoon,
  LucideSlidersHorizontal,
  LucideSun,
} from '@lucide/angular';
import { Dispatcher } from '@ngrx/signals/events';
import { AppStore, themeChanged } from '@core';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { SettingsStore } from '../../store';

@Component({
  selector: 'app-settings-page',
  imports: [
    RouterLink,
    LucideArrowLeft,
    LucideBell,
    LucideChevronRight,
    LucideListTodo,
    LucideMoon,
    LucideSlidersHorizontal,
    LucideSun,
    HlmBadge,
    HlmSeparator,
  ],
  providers: [SettingsStore],
  styleUrl: './settings-page.scss',
  templateUrl: './settings-page.html',
})
export class SettingsPage {
  private readonly dispatcher = inject(Dispatcher);
  protected readonly appStore = inject(AppStore);
  protected readonly store = inject(SettingsStore);

  setTheme(nextMode: 'light' | 'dark'): void {
    this.store.setAppearance(nextMode);
    this.dispatcher.dispatch(themeChanged({ mode: nextMode }));
  }
}
