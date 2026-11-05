import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
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
export class Header implements OnDestroy {
  private readonly dispatcher = inject(Dispatcher);
  protected readonly appStore = inject(AppStore);

  readonly showDropdown = signal(false);
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  toggleDropdown(): void {
    this.cancelCloseTimer();
    this.showDropdown.update((v) => !v);
  }

  onMouseEnter(): void {
    this.cancelCloseTimer();
    this.showDropdown.set(true);
  }

  onMouseLeave(): void {
    this.startCloseTimer();
  }

  cancelCloseTimer(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  startCloseTimer(): void {
    this.cancelCloseTimer();
    this.closeTimer = setTimeout(() => {
      this.showDropdown.set(false);
      this.closeTimer = null;
    }, 1000);
  }

  closeDropdown(): void {
    this.cancelCloseTimer();
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

  ngOnDestroy(): void {
    this.cancelCloseTimer();
  }
}
