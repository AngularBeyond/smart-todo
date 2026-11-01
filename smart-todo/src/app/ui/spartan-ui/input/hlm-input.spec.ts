import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HlmInput } from './hlm-input';

@Component({
  imports: [ReactiveFormsModule, HlmInput],
  template: `
    <form [formGroup]="form">
      <input id="test-email" formControlName="email" hlmInput />
    </form>
  `,
})
class TestInputComponent {
  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });
}

describe('HlmInput validation behavior', () => {
  let fixture: ComponentFixture<TestInputComponent>;
  let component: TestInputComponent;
  let inputEl: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    inputEl = fixture.nativeElement.querySelector('input');
  });

  it('should inspect aria-invalid and styling on page load before being touched', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const attrs: Record<string, string | null> = {};
    for (const attr of Array.from(inputEl.attributes)) {
      attrs[attr.name] = attr.value;
    }
    expect(attrs['aria-invalid']).toBe('true');
    expect(attrs['data-matches-spartan-invalid']).toBeUndefined();
  });

  it('should set data-matches-spartan-invalid on blur when invalid', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    inputEl.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.form.controls.email.touched).toBe(true);
    expect(inputEl.getAttribute('data-matches-spartan-invalid')).toBe('true');
  });

  it('should set data-matches-spartan-invalid when form is marked as touched (submit)', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(inputEl.getAttribute('data-matches-spartan-invalid')).toBeNull();

    component.form.markAllAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(inputEl.getAttribute('data-matches-spartan-invalid')).toBe('true');
  });

  it('should clear data-matches-spartan-invalid when input becomes valid', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    component.form.markAllAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(inputEl.getAttribute('data-matches-spartan-invalid')).toBe('true');

    component.form.controls.email.setValue('valid@example.com');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.form.controls.email.valid).toBe(true);
    expect(inputEl.getAttribute('data-matches-spartan-invalid')).toBeNull();
  });
});

import { signal } from '@angular/core';
import { form, FormField, required, email as emailValidator, submit } from '@angular/forms/signals';

@Component({
  imports: [FormField, HlmInput],
  template: `
    <form (submit)="onSubmit($event)">
      <input id="sig-email" [formField]="testForm.email" hlmInput />
    </form>
  `,
})
class TestSignalInputComponent {
  readonly model = signal({ email: '' });
  readonly testForm = form(this.model, (schemaPath) => {
    required(schemaPath.email, { message: 'Email is required.' });
    emailValidator(schemaPath.email, { message: 'Invalid email.' });
  });

  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.testForm, async () => {});
  }
}

describe('HlmInput with Signal Forms', () => {
  let fixture: ComponentFixture<TestSignalInputComponent>;
  let component: TestSignalInputComponent;
  let inputEl: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestSignalInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestSignalInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    inputEl = fixture.nativeElement.querySelector('input');
  });

  it('should not display invalid styling on load', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.testForm.email().touched()).toBe(false);
    expect(component.testForm.email().invalid()).toBe(true);
    expect(inputEl.getAttribute('data-matches-spartan-invalid')).toBeNull();
  });

  it('should set data-matches-spartan-invalid on blur when invalid', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    inputEl.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.testForm.email().touched()).toBe(true);
    expect(inputEl.getAttribute('data-matches-spartan-invalid')).toBe('true');
  });

  it('should set data-matches-spartan-invalid when submit() is triggered', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(inputEl.getAttribute('data-matches-spartan-invalid')).toBeNull();

    component.onSubmit(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.testForm.email().touched()).toBe(true);
    expect(inputEl.getAttribute('data-matches-spartan-invalid')).toBe('true');
  });

  it('should clear data-matches-spartan-invalid when input becomes valid in Signal Forms', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    component.onSubmit(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(inputEl.getAttribute('data-matches-spartan-invalid')).toBe('true');

    component.model.set({ email: 'hello@example.com' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.testForm.email().valid()).toBe(true);
    expect(inputEl.getAttribute('data-matches-spartan-invalid')).toBeNull();
  });
});
