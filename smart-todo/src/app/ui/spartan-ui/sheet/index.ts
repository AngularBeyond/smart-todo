import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  untracked,
} from '@angular/core';
import { type BooleanInput } from '@angular/cdk/coercion';
import { type ClassValue } from 'clsx';
import { provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { BrnDialog, BrnDialogRef, provideBrnDialogDefaultOptions } from '@spartan-ng/brain/dialog';
import {
  BrnSheet,
  BrnSheetClose,
  BrnSheetContent,
  BrnSheetDescription,
  BrnSheetOverlay,
  BrnSheetTitle,
  BrnSheetTrigger,
} from '@spartan-ng/brain/sheet';
import { injectCustomClassSettable } from '@spartan-ng/brain/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { classes, hlm } from '@spartan-ng/helm/utils';

@Directive({
  selector: 'button[hlmSheetClose]',
  exportAs: 'hlmSheetClose',
  hostDirectives: [BrnSheetClose],
  host: { 'data-slot': 'sheet-close' },
})
export class HlmSheetClose {}

@Component({
  selector: 'hlm-sheet-content',
  exportAs: 'hlmSheetContent',
  imports: [HlmButton, HlmSheetClose, HlmIconImports],
  providers: [provideIcons({ lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sheet-content',
    '[attr.data-side]': '_sheet.sideState()',
    '[attr.data-state]': 'state()',
  },
  template: `
    <ng-content />

    @if (showCloseButton()) {
      <button hlmBtn variant="ghost" size="icon-sm" class="absolute end-4 top-4" hlmSheetClose>
        <span class="sr-only">{{ closeLabel() }}</span>
        <ng-icon hlm size="sm" name="lucideX" />
      </button>
    }
  `,
})
export class HlmSheetContent {
  private readonly _dialogRef = inject(BrnDialogRef);
  protected readonly _sheet = inject(BrnSheet);

  public readonly state = this._dialogRef.state;

  public readonly side = input<'top' | 'bottom' | 'left' | 'right'>('right');
  public readonly userClass = input<ClassValue>('', { alias: 'class' });
  public readonly showCloseButton = input<boolean, BooleanInput>(true, { transform: booleanAttribute });
  public readonly closeLabel = input<string>('Close');

  constructor() {
    classes(() => [
      'bg-popover text-popover-foreground fixed z-50 flex flex-col gap-4 bg-clip-padding text-sm shadow-lg transition duration-200 ease-in-out data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm',
      'data-open:animate-in data-closed:animate-out',
      'data-[side=top]:data-closed:slide-out-to-top data-[side=top]:data-open:slide-in-from-top',
      'data-[side=bottom]:data-closed:slide-out-to-bottom data-[side=bottom]:data-open:slide-in-from-bottom',
      'data-[side=left]:data-closed:slide-out-to-left data-[side=left]:data-open:slide-in-from-left',
      'data-[side=right]:data-closed:slide-out-to-right data-[side=right]:data-open:slide-in-from-right',
      this.userClass(),
    ]);
  }
}

@Directive({
  selector: '[hlmSheetDescription]',
  exportAs: 'hlmSheetDescription',
  hostDirectives: [BrnSheetDescription],
  host: { 'data-slot': 'sheet-description' },
})
export class HlmSheetDescription {
  constructor() {
    classes(() => 'text-muted-foreground text-sm');
  }
}

@Directive({
  selector: '[hlmSheetFooter],hlm-sheet-footer',
  exportAs: 'hlmSheetFooter',
  host: { 'data-slot': 'sheet-footer' },
})
export class HlmSheetFooter {
  constructor() {
    classes(() => 'gap-2 p-6 mt-auto flex flex-col');
  }
}

@Directive({
  selector: '[hlmSheetHeader],hlm-sheet-header',
  exportAs: 'hlmSheetHeader',
  host: { 'data-slot': 'sheet-header' },
})
export class HlmSheetHeader {
  constructor() {
    classes(() => 'gap-1.5 p-6 flex flex-col');
  }
}

@Directive({
  selector: '[hlmSheetOverlay],hlm-sheet-overlay',
  exportAs: 'hlmSheetOverlay',
  hostDirectives: [BrnSheetOverlay],
})
export class HlmSheetOverlay {
  private readonly _classSettable = injectCustomClassSettable({ optional: true, host: true });
  public readonly userClass = input<ClassValue>('', { alias: 'class' });
  protected readonly _computedClass = computed(() =>
    hlm(
      'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 isolate fixed inset-0 z-50 bg-black/80 duration-100 supports-backdrop-filter:backdrop-blur-xs',
      this.userClass(),
    ),
  );

  constructor() {
    effect(() => {
      const classValue = this._computedClass();
      untracked(() => this._classSettable?.setClassToCustomElement(classValue));
    });
  }
}

@Directive({
  selector: '[hlmSheetPortal]',
  exportAs: 'hlmSheetPortal',
  hostDirectives: [{ directive: BrnSheetContent, inputs: ['context', 'class'] }],
})
export class HlmSheetPortal {}

@Directive({
  selector: '[hlmSheetTitle]',
  exportAs: 'hlmSheetTitle',
  hostDirectives: [BrnSheetTitle],
  host: { 'data-slot': 'sheet-title' },
})
export class HlmSheetTitle {
  constructor() {
    classes(() => 'text-foreground text-base font-medium');
  }
}

@Directive({
  selector: 'button[hlmSheetTrigger],button[hlmSheetTriggerFor]',
  exportAs: 'hlmSheetTrigger',
  hostDirectives: [
    {
      directive: BrnSheetTrigger,
      inputs: ['id', 'brnDialogTriggerFor: hlmSheetTriggerFor', 'side', 'type'],
    },
  ],
  host: { 'data-slot': 'sheet-trigger' },
})
export class HlmSheetTrigger {}

@Component({
  selector: 'hlm-sheet',
  exportAs: 'hlmSheet',
  imports: [HlmSheetOverlay],
  providers: [
    {
      provide: BrnDialog,
      useExisting: forwardRef(() => BrnSheet),
    },
    {
      provide: BrnSheet,
      useExisting: forwardRef(() => HlmSheet),
    },
    provideBrnDialogDefaultOptions({}),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-sheet-overlay />
    <ng-content />
  `,
})
export class HlmSheet extends BrnSheet {}

export const HlmSheetImports = [
  HlmSheet,
  HlmSheetClose,
  HlmSheetContent,
  HlmSheetDescription,
  HlmSheetFooter,
  HlmSheetHeader,
  HlmSheetOverlay,
  HlmSheetPortal,
  HlmSheetTitle,
  HlmSheetTrigger,
] as const;
