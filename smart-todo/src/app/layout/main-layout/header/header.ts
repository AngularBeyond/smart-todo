import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideSparkles,
  LucideMoon,
  LucideSun,
  LucideBot,
  LucideMenu,
  LucideUser,
  LucideSettings2,
  LucideLogOut,
} from '@lucide/angular';
import { AppStore, themeChanged, toggleMobileSidebar, userLogout } from '@core';
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
    LucideBot,
    LucideMenu,
    LucideUser,
    LucideSettings2,
    LucideLogOut,
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

  readonly showDropdown = signal(false);

  toggleDropdown(): void {
    this.showDropdown.update((v) => !v);
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
  }

  logout(): void {
    this.closeDropdown();
    this.dispatcher.dispatch(userLogout());
  }

  toggleTheme(): void {
    const nextMode = this.appStore.theme() === 'dark' ? 'light' : 'dark';
    this.dispatcher.dispatch(themeChanged({ mode: nextMode }));
  }

  toggleSidebar(): void {
    this.dispatcher.dispatch(toggleMobileSidebar());
  }
}
