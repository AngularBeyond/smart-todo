import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListHeaderComponent } from './list-header.component';
import { TodoListSummary } from '@core';

const mockList: TodoListSummary = {
  id: 'list-1',
  name: 'Work Projects',
  isStarred: false,
  order: 1000,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  totalCount: 5,
  activeCount: 3,
};

describe('ListHeaderComponent', () => {
  let fixture: ComponentFixture<ListHeaderComponent>;
  let component: ListHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('list', mockList);
    fixture.detectChanges();
  });

  it('renders the list title and active count', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Work Projects');
    expect(compiled.textContent).toContain('3 active');
  });

  it('switches to editing mode on title click', () => {
    expect(component.isEditingTitle()).toBe(false);

    component.startEditing();
    fixture.detectChanges();

    expect(component.isEditingTitle()).toBe(true);
    expect(component.editingTitle()).toBe('Work Projects');

    const inputEl = fixture.nativeElement.querySelector('input');
    expect(inputEl).toBeTruthy();
  });

  it('emits renamed when title changed on saveTitle', () => {
    const renamedSpy = vi.fn();
    component.renamed.subscribe(renamedSpy);

    component.startEditing();
    component.editingTitle.set('New Work Projects');
    component.saveTitle();

    expect(renamedSpy).toHaveBeenCalledWith('New Work Projects');
    expect(component.isEditingTitle()).toBe(false);
  });

  it('does not emit renamed if title did not change', () => {
    const renamedSpy = vi.fn();
    component.renamed.subscribe(renamedSpy);

    component.startEditing();
    component.editingTitle.set('Work Projects');
    component.saveTitle();

    expect(renamedSpy).not.toHaveBeenCalled();
    expect(component.isEditingTitle()).toBe(false);
  });

  it('cancels editing on cancelEditing or Escape', () => {
    component.startEditing();
    component.editingTitle.set('Changed');

    component.onTitleKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(component.isEditingTitle()).toBe(false);
    expect(component.editingTitle()).toBe('');
  });

  it('emits starToggled on star button click', () => {
    const starSpy = vi.fn();
    component.starToggled.subscribe(starSpy);

    component.toggleStar();
    expect(starSpy).toHaveBeenCalled();
  });

  it('emits deleted when confirmDelete is called', () => {
    const deletedSpy = vi.fn();
    component.deleted.subscribe(deletedSpy);

    component.confirmDelete();
    expect(deletedSpy).toHaveBeenCalled();
  });
});
