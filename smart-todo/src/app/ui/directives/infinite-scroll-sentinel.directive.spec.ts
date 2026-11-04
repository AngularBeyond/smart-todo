import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InfiniteScrollSentinelDirective } from './infinite-scroll-sentinel.directive';

@Component({
  standalone: true,
  imports: [InfiniteScrollSentinelDirective],
  template: `
    <div
      appInfiniteScrollSentinel
      [disabled]="isDisabled()"
      (reachedBottom)="onReachedBottom()"
    ></div>
  `,
})
class TestHostComponent {
  readonly isDisabled = signal(false);
  readonly onReachedBottom = vi.fn();
}

describe('InfiniteScrollSentinelDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let observeSpy: any;
  let disconnectSpy: any;
  let observerCallback: any;

  beforeEach(async () => {
    observeSpy = vi.fn();
    disconnectSpy = vi.fn();

    // Mock IntersectionObserver
    class MockIntersectionObserver {
      constructor(callback: any) {
        observerCallback = callback;
      }
      observe = observeSpy;
      disconnect = disconnectSpy;
      unobserve = vi.fn();
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('observes the host element on init when not disabled', () => {
    expect(observeSpy).toHaveBeenCalled();
  });

  it('emits reachedBottom when sentinel enters viewport', () => {
    expect(observerCallback).toBeDefined();

    // Simulate element intersecting viewport
    observerCallback([{ isIntersecting: true }]);

    expect(hostComponent.onReachedBottom).toHaveBeenCalledTimes(1);
  });

  it('does not emit reachedBottom when element is not intersecting', () => {
    observerCallback([{ isIntersecting: false }]);

    expect(hostComponent.onReachedBottom).not.toHaveBeenCalled();
  });

  it('disconnects observer when disabled changes to true', () => {
    hostComponent.isDisabled.set(true);
    fixture.detectChanges();

    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('disconnects observer on destroy', () => {
    fixture.destroy();
    expect(disconnectSpy).toHaveBeenCalled();
  });
});
