import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmToasterImports } from '@ui';
import { AppStore } from '@core';

@Component({
  imports: [RouterOutlet, HlmToasterImports],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly appStore = inject(AppStore);
  protected readonly theme = this.appStore.theme;
  protected readonly title = signal('smart-todo');
}
