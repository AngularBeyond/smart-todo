import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppStore, setMobileSidebarOpen } from '@core';
import { Dispatcher } from '@ngrx/signals/events';
import { HlmSheetImports } from '@ui';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-main',
  imports: [Header, Sidebar, RouterOutlet, HlmSheetImports],
  styleUrl: './main.scss',
  templateUrl: './main.html',
})
export class Main {
  protected readonly appStore = inject(AppStore);
  private readonly dispatcher = inject(Dispatcher);

  onOpenChange(isOpen: boolean): void {
    this.dispatcher.dispatch(setMobileSidebarOpen({ isOpen }));
  }
}
