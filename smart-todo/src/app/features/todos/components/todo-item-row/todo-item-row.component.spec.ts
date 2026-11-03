import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TodoItemRowComponent } from './todo-item-row.component';
import { TodoItem } from '../../models';

describe('TodoItemRowComponent', () => {
  let component: TodoItemRowComponent;
  let componentRef: ComponentRef<TodoItemRowComponent>;
  let fixture: ComponentFixture<TodoItemRowComponent>;

  const mockActiveTodo: TodoItem = {
    id: 'todo-1',
    listId: 'list-1',
    userId: 'user-1',
    text: 'Buy organic almond milk',
    isCompleted: false,
    order: 1000,
    createdAt: '2026-11-03T11:00:00Z',
    updatedAt: '2026-11-03T11:00:00Z',
  };

  const mockCompletedTodo: TodoItem = {
    id: 'todo-2',
    listId: 'list-1',
    userId: 'user-1',
    text: 'Renew driver license',
    isCompleted: true,
    order: 2000,
    createdAt: '2026-11-03T09:00:00Z',
    updatedAt: '2026-11-03T11:30:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodoItemRowComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoItemRowComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('todo', mockActiveTodo);
    fixture.detectChanges();
  });

  it('renders active todo with drag handle and text', () => {
    const textButton = fixture.nativeElement.querySelector('button.block') as HTMLButtonElement;
    expect(textButton.textContent?.trim()).toBe('Buy organic almond milk');

    const dragHandle = fixture.nativeElement.querySelector('[cdkDragHandle]');
    expect(dragHandle).toBeTruthy();
    expect(component.isEditing()).toBe(false);
  });

  it('hides drag handle when todo is completed or isDraggable is false', () => {
    componentRef.setInput('todo', mockCompletedTodo);
    fixture.detectChanges();

    const dragHandleCompleted = fixture.nativeElement.querySelector('[cdkDragHandle]');
    expect(dragHandleCompleted).toBeNull();

    componentRef.setInput('todo', mockActiveTodo);
    componentRef.setInput('isDraggable', false);
    fixture.detectChanges();

    const dragHandleDisabled = fixture.nativeElement.querySelector('[cdkDragHandle]');
    expect(dragHandleDisabled).toBeNull();
  });

  it('emits toggleComplete when checkbox button is clicked', () => {
    const toggleSpy = vi.fn();
    component.toggleComplete.subscribe(toggleSpy);

    const checkboxButton = fixture.nativeElement.querySelector('button[type="button"]') as HTMLButtonElement;
    checkboxButton.click();

    expect(toggleSpy).toHaveBeenCalled();
  });

  it('switches to inline edit mode on click, emits textUpdated on Enter and resets edit mode', () => {
    const updateSpy = vi.fn();
    component.textUpdated.subscribe(updateSpy);

    const textButton = fixture.nativeElement.querySelector('button.block') as HTMLButtonElement;
    textButton.click();
    fixture.detectChanges();

    expect(component.isEditing()).toBe(true);

    const inputEl = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(inputEl).toBeTruthy();
    expect(inputEl.value).toBe('Buy organic almond milk');

    // Change input value
    inputEl.value = 'Buy oat milk instead';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    // Hit Enter
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    inputEl.dispatchEvent(enterEvent);
    fixture.detectChanges();

    expect(updateSpy).toHaveBeenCalledWith('Buy oat milk instead');
    expect(component.isEditing()).toBe(false);
  });

  it('saves edit on blur if changed', () => {
    const updateSpy = vi.fn();
    component.textUpdated.subscribe(updateSpy);

    component.startEditing();
    fixture.detectChanges();

    component.editText.set('Updated via blur');
    component.saveEdit();

    expect(updateSpy).toHaveBeenCalledWith('Updated via blur');
    expect(component.isEditing()).toBe(false);
  });

  it('cancels edit on Escape without emitting textUpdated', () => {
    const updateSpy = vi.fn();
    component.textUpdated.subscribe(updateSpy);

    component.startEditing();
    fixture.detectChanges();

    const inputEl = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    inputEl.value = 'Changed but canceled';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    inputEl.dispatchEvent(escapeEvent);
    fixture.detectChanges();

    expect(updateSpy).not.toHaveBeenCalled();
    expect(component.isEditing()).toBe(false);
  });

  it('does not allow inline editing if todo is completed', () => {
    componentRef.setInput('todo', mockCompletedTodo);
    fixture.detectChanges();

    component.startEditing();
    expect(component.isEditing()).toBe(false);
  });

  it('emits deleteClicked when delete button is pressed', () => {
    const deleteSpy = vi.fn();
    component.deleteClicked.subscribe(deleteSpy);

    const deleteBtn = fixture.nativeElement.querySelector('button[aria-label^="Delete task"]') as HTMLButtonElement;
    deleteBtn.click();

    expect(deleteSpy).toHaveBeenCalled();
  });
});
