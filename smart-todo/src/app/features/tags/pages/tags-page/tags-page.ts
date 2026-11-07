import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideArrowLeft,
  LucideCheck,
  LucideChevronRight,
  LucidePlus,
  LucideSearch,
  LucideTag,
  LucideTrash,
} from '@lucide/angular';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { TagsStore } from '../../store';

@Component({
  selector: 'app-tags-page',
  imports: [
    RouterLink,
    FormsModule,
    LucideArrowLeft,
    LucideCheck,
    LucideChevronRight,
    LucidePlus,
    LucideSearch,
    LucideTag,
    LucideTrash,
    HlmButton,
    HlmBadge,
    HlmInput,
    HlmSeparator,
  ],
  providers: [TagsStore],
  styleUrl: './tags-page.scss',
  templateUrl: './tags-page.html',
})
export class TagsPage {
  protected readonly store = inject(TagsStore);
}
