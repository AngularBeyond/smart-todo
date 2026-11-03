import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TodoCreateBarComponent } from './todo-create-bar.component';

describe('TodoCreateBarComponent', () => {
  let component: TodoCreateBarComponent;
  let componentRef: ComponentRef<TodoCreateBarComponent>;
  let fixture: ComponentFixture<TodoCreateBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodoCreateBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoCreateBarComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  it('renders with default inputs and empty text', () => {
    expect(component.text()).toBe('');
    expect(component.isQuotaReached()).toBe(false);
    expect(component.quotaBadgeText()).toBe('0/40');
    expect(component.canSubmit()).toBe(false);

    const inputEl = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(inputEl).toBeTruthy();
    expect(inputEl.placeholder).toBe('What needs your attention?');
    expect(inputEl.disabled).toBe(false);
  });

  it('updates text on input change and enables Add button', () => {
    const inputEl = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    inputEl.value = 'Buy groceries';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.text()).toBe('Buy groceries');
    expect(component.canSubmit()).toBe(true);

    const buttonEl = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(buttonEl.disabled).toBe(false);
  });

  it('emits create event on onSubmit and resets text', () => {
    const createSpy = vi.fn();
    component.create.subscribe(createSpy);

    component.text.set('   Clean the garage   ');
    expect(component.canSubmit()).toBe(true);

    component.onSubmit();

    expect(createSpy).toHaveBeenCalledWith('Clean the garage');
    expect(component.text()).toBe('');
    expect(component.canSubmit()).toBe(false);
  });

  it('submits when Enter is pressed in input', () => {
    const createSpy = vi.fn();
    component.create.subscribe(createSpy);

    const inputEl = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    inputEl.value = 'Finish report';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    inputEl.dispatchEvent(enterEvent);
    fixture.detectChanges();

    expect(createSpy).toHaveBeenCalledWith('Finish report');
    expect(component.text()).toBe('');
  });

  it('disables input and Add button when isQuotaReached is true', () => {
    componentRef.setInput('isQuotaReached', true);
    componentRef.setInput('quotaBadgeText', '40/40');
    component.text.set('New task attempt');
    fixture.detectChanges();

    expect(component.canSubmit()).toBe(false);

    const inputEl = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(inputEl.disabled).toBe(true);
    expect(inputEl.placeholder).toBe('List quota reached (40/40)');

    const buttonEl = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(buttonEl.disabled).toBe(true);

    const badgeEl = fixture.nativeElement.querySelector('[hlmBadge]') as HTMLElement;
    expect(badgeEl.textContent?.trim()).toBe('40/40');
  });

  it('does not emit create when input is blank or whitespace only', () => {
    const createSpy = vi.fn();
    component.create.subscribe(createSpy);

    component.text.set('    ');
    component.onSubmit();

    expect(createSpy).not.toHaveBeenCalled();
  });
});
