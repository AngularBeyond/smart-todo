import { Directive, ElementRef, inject, input, OnInit } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true,
})
export class AutoFocusDirective implements OnInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly appAutoFocusSelect = input<boolean>(true);

  ngOnInit(): void {
    const el = this.elementRef.nativeElement;
    // Defer to next microtask/tick so element is rendered and interactive
    queueMicrotask(() => {
      el.focus();
      if (this.appAutoFocusSelect() && el instanceof HTMLInputElement) {
        el.select();
      }
    });
  }
}
