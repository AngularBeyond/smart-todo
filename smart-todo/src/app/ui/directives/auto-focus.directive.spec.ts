import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutoFocusDirective } from './auto-focus.directive';

@Component({
  imports: [AutoFocusDirective],
  template: `<input appAutoFocus [appAutoFocusSelect]="selectText" />`,
})
class TestComponent {
  selectText = true;
}

describe('AutoFocusDirective', () => {
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent, AutoFocusDirective],
    }).compileComponents();
  });

  it('focuses and selects the input element', async () => {
    fixture = TestBed.createComponent(TestComponent);
    const inputEl = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const focusSpy = vi.spyOn(inputEl, 'focus');
    const selectSpy = vi.spyOn(inputEl, 'select');

    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(focusSpy).toHaveBeenCalled();
    expect(selectSpy).toHaveBeenCalled();
  });

  it('does not select text when appAutoFocusSelect is false', async () => {
    fixture = TestBed.createComponent(TestComponent);
    fixture.componentInstance.selectText = false;
    const inputEl = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const focusSpy = vi.spyOn(inputEl, 'focus');
    const selectSpy = vi.spyOn(inputEl, 'select');

    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(focusSpy).toHaveBeenCalled();
    expect(selectSpy).not.toHaveBeenCalled();
  });
});
