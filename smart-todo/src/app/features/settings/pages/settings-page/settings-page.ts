import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideBell,
  LucideCheck,
  LucideChevronRight,
  LucideClock3,
  LucidePalette,
  LucideShield,
} from '@lucide/angular';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { SettingsStore } from '../../store';

@Component({
  selector: 'app-settings-page',
  imports: [
    RouterLink,
    TitleCasePipe,
    LucideArrowLeft,
    LucideBell,
    LucideCheck,
    LucideChevronRight,
    LucideClock3,
    LucidePalette,
    LucideShield,
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
  protected readonly store = inject(SettingsStore);
}
