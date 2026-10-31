import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideArrowLeft,
  LucideBell,
  LucideCheck,
  LucideChevronRight,
  LucideMail,
  LucideMoon,
  LucideShield,
  LucideUserRound,
} from '@lucide/angular';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { ProfileStore } from '../../store';

@Component({
  selector: 'app-profile-page',
  imports: [
    RouterLink,
    FormsModule,
    LucideArrowLeft,
    LucideBell,
    LucideCheck,
    LucideChevronRight,
    LucideMail,
    LucideMoon,
    LucideShield,
    LucideUserRound,
    HlmButton,
    HlmBadge,
    HlmInput,
    HlmSeparator,
  ],
  providers: [ProfileStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './profile-page.css',
  templateUrl: './profile-page.html',
})
export class ProfilePage {
  protected readonly store = inject(ProfileStore);
}
