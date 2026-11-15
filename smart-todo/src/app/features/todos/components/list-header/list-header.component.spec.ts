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

  it('renders Star, Search, and Delete action buttons next to active count badge', () => {
    const starBtn = fixture.nativeElement.querySelector('button[aria-label="Star list"]');
    const searchBtn = fixture.nativeElement.querySelector('button[aria-label="Toggle search filter"]');
    const deleteBtn = fixture.nativeElement.querySelector('button[aria-label="Delete list"]');

    expect(starBtn).toBeTruthy();
    expect(searchBtn).toBeTruthy();
    expect(deleteBtn).toBeTruthy();
  });

  it('emits toggleStar when star button is clicked', () => {
    const toggleStarSpy = vi.fn();
    component.toggleStar.subscribe(toggleStarSpy);

    const starBtn = fixture.nativeElement.querySelector('button[aria-label="Star list"]') as HTMLButtonElement;
    starBtn.click();

    expect(toggleStarSpy).toHaveBeenCalledTimes(1);
  });

  it('renders star button with active styling when list is starred', () => {
    fixture.componentRef.setInput('list', { ...mockList, isStarred: true });
    fixture.detectChanges();

    const starBtn = fixture.nativeElement.querySelector('button[aria-label="Unstar list"]') as HTMLButtonElement;
    expect(starBtn).toBeTruthy();
    expect(starBtn.classList.contains('text-amber-500')).toBe(true);
  });

  it('emits toggleSearch when search button is clicked', () => {
    const toggleSearchSpy = vi.fn();
    component.toggleSearch.subscribe(toggleSearchSpy);

    const searchBtn = fixture.nativeElement.querySelector('button[aria-label="Toggle search filter"]') as HTMLButtonElement;
    searchBtn.click();

    expect(toggleSearchSpy).toHaveBeenCalledTimes(1);
  });

  it('applies active styling to search button when isSearchOpen is true', () => {
    fixture.componentRef.setInput('isSearchOpen', true);
    fixture.detectChanges();

    const searchBtn = fixture.nativeElement.querySelector('button[aria-label="Toggle search filter"]') as HTMLButtonElement;
    expect(searchBtn.classList.contains('text-primary')).toBe(true);
  });

  it('emits deleteList when delete action is confirmed', () => {
    const deleteListSpy = vi.fn();
    component.deleteList.subscribe(deleteListSpy);

    // Open the alert dialog
    const deleteTrigger = fixture.nativeElement.querySelector('button[aria-label="Delete list"]') as HTMLButtonElement;
    deleteTrigger.click();
    fixture.detectChanges();

    // Find the confirm action button inside the portal/document
    const confirmActionBtn = document.querySelector('button[hlmAlertDialogAction]') as HTMLButtonElement;
    expect(confirmActionBtn).toBeTruthy();
    confirmActionBtn.click();

    expect(deleteListSpy).toHaveBeenCalledTimes(1);
  });
});
