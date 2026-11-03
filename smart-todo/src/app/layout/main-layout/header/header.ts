import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideSparkles,
  LucideMoon,
  LucideSun,
  LucideBell,
  LucideMenu,
} from '@lucide/angular';
import { AppStore, themeChanged, toggleMobileSidebar } from '@core';
import { Dispatcher } from '@ngrx/signals/events';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSeparator } from '@spartan-ng/helm/separator';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    LucideSparkles,
    LucideMoon,
    LucideSun,
    LucideBell,
    LucideMenu,
    HlmButton,
    HlmSeparator,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  private readonly dispatcher = inject(Dispatcher);
  protected readonly appStore = inject(AppStore);

  toggleTheme(): void {
    const nextMode = this.appStore.theme() === 'dark' ? 'light' : 'dark';
    this.dispatcher.dispatch(themeChanged({ mode: nextMode }));
  }

  toggleSidebar(): void {
    this.dispatcher.dispatch(toggleMobileSidebar());
  }
}
