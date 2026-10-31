import { type BooleanInput, type NumberInput } from '@angular/cdk/coercion';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCircleCheck,
  lucideInfo,
  lucideLoader2,
  lucideOctagonX,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { BrnSonnerImports, toast, type ToasterProps } from '@spartan-ng/brain/sonner';
import { hlm } from '@spartan-ng/helm/utils';
import { type ClassValue } from 'clsx';

@Component({
  selector: 'hlm-toaster',
  imports: [BrnSonnerImports, NgIcon],
  providers: [
    provideIcons({
      lucideCircleCheck,
      lucideInfo,
      lucideTriangleAlert,
      lucideOctagonX,
      lucideLoader2,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <brn-sonner-toaster
      [class]="_computedClass()"
      [invert]="invert()"
      [theme]="theme()"
      [position]="position()"
      [hotKey]="hotKey()"
      [richColors]="richColors()"
      [expand]="expand()"
      [duration]="duration()"
      [visibleToasts]="visibleToasts()"
      [closeButton]="closeButton()"
      [toastOptions]="_computedToastOptions()"
      [offset]="offset()"
      [style]="userStyle()"
    >
      <ng-template #loadingIcon>
        <ng-icon
          name="lucideLoader2"
          class="overflow-visible! text-base [&>svg]:motion-safe:animate-spin"
        />
      </ng-template>
      <ng-template #successIcon>
        <ng-icon name="lucideCircleCheck" class="overflow-visible! text-base" />
      </ng-template>
      <ng-template #errorIcon>
        <button
          type="button"
          aria-label="Close toast"
          (click)="closeToast($event)"
          class="cursor-pointer inline-flex items-center justify-center p-0 bg-transparent border-0 text-inherit hover:opacity-75 transition-opacity focus:outline-none"
        >
          <ng-icon name="lucideOctagonX" class="overflow-visible! text-base pointer-events-none" />
        </button>
      </ng-template>
      <ng-template #infoIcon>
        <ng-icon name="lucideInfo" class="overflow-visible! text-base" />
      </ng-template>
      <ng-template #warningIcon>
        <ng-icon name="lucideTriangleAlert" class="overflow-visible! text-base" />
      </ng-template>
    </brn-sonner-toaster>
  `,
})
export class HlmToaster {
  public readonly invert = input<ToasterProps['invert'], BooleanInput>(false, {
    transform: booleanAttribute,
  });
  public readonly theme = input<ToasterProps['theme']>('light');
  public readonly position = input<ToasterProps['position']>('bottom-right');
  public readonly hotKey = input<ToasterProps['hotkey']>(['altKey', 'KeyT']);
  public readonly richColors = input<ToasterProps['richColors'], BooleanInput>(false, {
    transform: booleanAttribute,
  });
  public readonly expand = input<ToasterProps['expand'], BooleanInput>(false, {
    transform: booleanAttribute,
  });
  public readonly duration = input<ToasterProps['duration'], NumberInput>(4000, {
    transform: numberAttribute,
  });
  public readonly visibleToasts = input<ToasterProps['visibleToasts'], NumberInput>(3, {
    transform: numberAttribute,
  });
  public readonly closeButton = input<ToasterProps['closeButton'], BooleanInput>(true, {
    transform: booleanAttribute,
  });
  public readonly toastOptions = input<ToasterProps['toastOptions']>({});

  protected readonly _computedToastOptions = computed(() => {
    const options = this.toastOptions();
    return {
      ...options,
      classes: {
        ...options?.classes,
        toast: hlm('rounded-md!', options?.classes?.toast),
        closeButton: hlm(
          '[left:unset]! [right:0]! [transform:translate(35%,-35%)]! [&>svg]:pointer-events-none cursor-pointer',
          options?.classes?.closeButton,
        ),
      },
    };
  });
  public readonly offset = input<ToasterProps['offset']>(null);
  public readonly userClass = input<ClassValue>('', { alias: 'class' });
  public readonly userStyle = input<Record<string, string>>(
    {
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': 'var(--radius)',
      '--toast-close-button-start': 'unset',
      '--toast-close-button-end': '0',
      '--toast-close-button-transform': 'translate(35%, -35%)',
    },
    { alias: 'style' },
  );

  protected readonly _computedClass = computed(() => hlm('toaster group', this.userClass()));

  protected closeToast(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    const target = event.currentTarget as HTMLElement | null;
    const toastElement = target?.closest('[data-sonner-toast]');
    const toastId = toastElement?.getAttribute('id') || toastElement?.id;
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }
}

export const HlmToasterImports = [HlmToaster] as const;
