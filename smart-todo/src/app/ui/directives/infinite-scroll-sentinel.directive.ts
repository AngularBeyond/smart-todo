import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

@Directive({
  selector: '[appInfiniteScrollSentinel]',
  standalone: true,
})
export class InfiniteScrollSentinelDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly disabled = input<boolean>(false);
  readonly rootMargin = input<string>('100px');
  readonly threshold = input<number>(0.1);

  readonly reachedBottom = output<void>();

  private observer: IntersectionObserver | null = null;

  constructor() {
    effect(() => {
      const isDisabled = this.disabled();
      if (isDisabled) {
        this.disconnectObserver();
      } else {
        this.setupObserver();
      }
    });
  }

  ngOnInit(): void {
    if (!this.disabled()) {
      this.setupObserver();
    }
  }

  ngOnDestroy(): void {
    this.disconnectObserver();
  }

  private setupObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.disconnectObserver();

    try {
      this.observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry?.isIntersecting && !this.disabled()) {
            this.reachedBottom.emit();
          }
        },
        {
          root: null,
          rootMargin: this.rootMargin(),
          threshold: this.threshold(),
        },
      );

      this.observer.observe(this.elementRef.nativeElement);
    } catch {
      // In testing environments where IntersectionObserver constructor behaves differently
    }
  }

  private disconnectObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
