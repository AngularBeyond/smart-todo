import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideSparkles,
  LucideMoon,
  LucideSun,
  LucideBell,
} from '@lucide/angular';
import { AppStore } from '@core';
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
    HlmButton,
    HlmSeparator,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  protected readonly appStore = inject(AppStore);
}
