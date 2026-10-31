import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight, lucideEllipsis } from '@ng-icons/lucide';
import { BooleanInput } from '@angular/cdk/coercion';
import { ClassValue } from 'clsx';
import { buttonVariants, type ButtonVariants } from '@spartan-ng/helm/button';
import { classes, hlm } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmPagination],hlm-pagination',
  host: {
    'data-slot': 'pagination',
    role: 'navigation',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class HlmPagination {
  public readonly ariaLabel = input<string>('pagination', { alias: 'aria-label' });

  constructor() {
    classes(() => 'mx-auto flex w-full justify-center');
  }
}

@Directive({
  selector: 'ul[hlmPaginationContent]',
  host: { 'data-slot': 'pagination-content' },
})
export class HlmPaginationContent {
  constructor() {
    classes(() => 'gap-1 flex items-center');
  }
}

@Directive({
  selector: 'li[hlmPaginationItem]',
  host: { 'data-slot': 'pagination-item' },
})
export class HlmPaginationItem {}

@Directive({
  selector: '[hlmPaginationLink]',
  hostDirectives: [
    {
      directive: RouterLink,
      inputs: [
        'target',
        'queryParams',
        'fragment',
        'queryParamsHandling',
        'state',
        'info',
        'relativeTo',
        'preserveFragment',
        'skipLocationChange',
        'replaceUrl',
        'routerLink: link',
      ],
    },
  ],
  host: {
    'data-slot': 'pagination-link',
    '[attr.data-active]': 'isActive() ? "true" : null',
    '[attr.aria-current]': 'isActive() ? "page" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[tabindex]': 'disabled() ? -1 : 0',
  },
})
export class HlmPaginationLink {
  public readonly isActive = input<boolean, BooleanInput>(false, { transform: booleanAttribute });
  public readonly disabled = input<boolean, BooleanInput>(false, { transform: booleanAttribute });
  public readonly size = input<ButtonVariants['size']>('icon');
  public readonly link = input<RouterLink['routerLink']>();

  constructor() {
    classes(() => [
      'relative select-none',
      buttonVariants({
        variant: this.isActive() ? 'outline' : 'ghost',
        size: this.size(),
      }),
      this.link() === undefined && 'cursor-pointer',
      this.disabled() && 'pointer-events-none opacity-50',
    ]);
  }
}

@Component({
  selector: 'hlm-pagination-previous',
  imports: [HlmPaginationLink, NgIcon],
  providers: [provideIcons({ lucideChevronLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      hlmPaginationLink
      [class]="_computedClass()"
      [link]="link()"
      [queryParams]="queryParams()"
      [queryParamsHandling]="queryParamsHandling()"
      [size]="_size()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
    >
      <ng-icon name="lucideChevronLeft" class="rtl:rotate-180" />
      <span [class]="_labelClass()">{{ text() }}</span>
    </a>
  `,
})
export class HlmPaginationPrevious {
  public readonly userClass = input<ClassValue>('', { alias: 'class' });
  public readonly link = input<RouterLink['routerLink']>();
  public readonly queryParams = input<RouterLink['queryParams']>();
  public readonly queryParamsHandling = input<RouterLink['queryParamsHandling']>();
  public readonly ariaLabel = input<string>('Go to previous page', { alias: 'aria-label' });
  public readonly text = input<string>('Previous');
  public readonly iconOnly = input<boolean, BooleanInput>(false, { transform: booleanAttribute });
  public readonly disabled = input<boolean, BooleanInput>(false, { transform: booleanAttribute });

  protected readonly _labelClass = computed(() => (this.iconOnly() ? 'sr-only' : 'hidden sm:block'));
  protected readonly _size = computed<ButtonVariants['size']>(() => (this.iconOnly() ? 'icon' : 'default'));
  protected readonly _computedClass = computed(() =>
    hlm(
      !this.iconOnly() && 'ps-2!',
      this.disabled() && 'pointer-events-none opacity-50',
      this.userClass(),
    ),
  );
}

@Component({
  selector: 'hlm-pagination-next',
  imports: [HlmPaginationLink, NgIcon],
  providers: [provideIcons({ lucideChevronRight })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      hlmPaginationLink
      [class]="_computedClass()"
      [link]="link()"
      [queryParams]="queryParams()"
      [queryParamsHandling]="queryParamsHandling()"
      [size]="_size()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
    >
      <span [class]="_labelClass()">{{ text() }}</span>
      <ng-icon name="lucideChevronRight" class="rtl:rotate-180" />
    </a>
  `,
})
export class HlmPaginationNext {
  public readonly userClass = input<ClassValue>('', { alias: 'class' });
  public readonly link = input<RouterLink['routerLink']>();
  public readonly queryParams = input<RouterLink['queryParams']>();
  public readonly queryParamsHandling = input<RouterLink['queryParamsHandling']>();
  public readonly ariaLabel = input<string>('Go to next page', { alias: 'aria-label' });
  public readonly text = input<string>('Next');
  public readonly iconOnly = input<boolean, BooleanInput>(false, { transform: booleanAttribute });
  public readonly disabled = input<boolean, BooleanInput>(false, { transform: booleanAttribute });

  protected readonly _labelClass = computed(() => (this.iconOnly() ? 'sr-only' : 'hidden sm:block'));
  protected readonly _size = computed<ButtonVariants['size']>(() => (this.iconOnly() ? 'icon' : 'default'));
  protected readonly _computedClass = computed(() =>
    hlm(
      !this.iconOnly() && 'pe-2!',
      this.disabled() && 'pointer-events-none opacity-50',
      this.userClass(),
    ),
  );
}

@Component({
  selector: 'hlm-pagination-ellipsis',
  imports: [NgIcon],
  providers: [provideIcons({ lucideEllipsis })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'pagination-ellipsis' },
  template: `
    <ng-icon name="lucideEllipsis" />
    <span class="sr-only">{{ srOnlyText() }}</span>
  `,
})
export class HlmPaginationEllipsis {
  public readonly srOnlyText = input<string>('More pages');

  constructor() {
    classes(() => "size-9 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] flex items-center justify-center");
  }
}
