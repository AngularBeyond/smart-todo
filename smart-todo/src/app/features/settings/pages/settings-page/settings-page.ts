import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideBell,
  LucideCheck,
  LucideChevronRight,
  LucideClock3,
  LucideMoon,
  LucideShield,
  LucideSun,
} from '@lucide/angular';
import { Dispatcher } from '@ngrx/signals/events';
import { AppStore, themeChanged } from '@core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { SettingsStore } from '../../store';

@Component({
  selector: 'app-settings-page',
  imports: [
    RouterLink,
    LucideArrowLeft,
    LucideBell,
    LucideCheck,
    LucideChevronRight,
    LucideClock3,
    LucideMoon,
    LucideShield,
    LucideSun,
    HlmButton,
    HlmBadge,
    HlmSeparator,
  ],
  providers: [SettingsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './settings-page.css',
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
