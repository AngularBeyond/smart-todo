import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucidePlus,
  LucideSearch,
  LucideTag,
  LucideMoreHorizontal,
  LucideGripVertical,
  LucideCircle,
  LucideCheck,
  LucideTrash2,
  LucideChevronDown,
  LucideChevronRight,
  LucideCircleCheck,
} from '@lucide/angular';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmInput } from '@spartan-ng/helm/input';
import { TodosStore } from '../../store/todos.store';

@Component({
  selector: 'app-todos-page',
  imports: [
    FormsModule,
    LucidePlus,
    LucideSearch,
    LucideTag,
    LucideMoreHorizontal,
    LucideGripVertical,
    LucideCircle,
    LucideCheck,
    LucideTrash2,
    LucideChevronDown,
    LucideChevronRight,
    LucideCircleCheck,
    HlmButton,
    HlmBadge,
    HlmInput,
  ],
  providers: [TodosStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './todos-page.css',
  templateUrl: './todos-page.html',
})
export class TodosPage {
  protected readonly store = inject(TodosStore);
}
