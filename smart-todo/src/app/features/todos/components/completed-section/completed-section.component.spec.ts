import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompletedSectionComponent } from './completed-section.component';
import { TodoItem } from '../../models';

describe('CompletedSectionComponent', () => {
  let component: CompletedSectionComponent;
  let componentRef: ComponentRef<CompletedSectionComponent>;
  let fixture: ComponentFixture<CompletedSectionComponent>;

  const mockCompletedTodo: TodoItem = {
    id: 'todo-c1',
    listId: 'list-1',
    userId: 'user-1',
    text: 'Finished cleaning house',
    isCompleted: true,
    order: 500,
    createdAt: '2026-11-03T10:00:00Z',
    updatedAt: '2026-11-03T11:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompletedSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CompletedSectionComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('completedTodos', [mockCompletedTodo]);
    componentRef.setInput('completedCount', 1);
    componentRef.setInput('isExpanded', false);
    componentRef.setInput('isLoading', false);
    componentRef.setInput('hasMore', false);
    fixture.detectChanges();
  });

  it('renders collapsed state with badge count and Hide/View history text', () => {
    const badge = fixture.nativeElement.querySelector('[hlmBadge]') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('1');

    const historyText = fixture.nativeElement.querySelector('.ml-auto') as HTMLElement;
    expect(historyText.textContent?.trim()).toBe('View history');

    // Content should not be rendered when isExpanded is false
    const content = fixture.nativeElement.querySelector('.border-t');
    expect(content).toBeNull();
  });

  it('emits toggleExpand when header button is clicked', () => {
    const expandSpy = vi.fn();
    component.toggleExpand.subscribe(expandSpy);

    const headerBtn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    headerBtn.click();

    expect(expandSpy).toHaveBeenCalled();
  });

  it('renders completed tasks and emits row events when expanded', () => {
    const toggleSpy = vi.fn();
    const deleteSpy = vi.fn();
    const updateSpy = vi.fn();
    component.toggleTodo.subscribe(toggleSpy);
    component.deleteTodo.subscribe(deleteSpy);
    component.updateTodoText.subscribe(updateSpy);

    componentRef.setInput('isExpanded', true);
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('app-todo-item-row');
    expect(row).toBeTruthy();

    // Trigger row outputs
    component.onToggleTodo(mockCompletedTodo);
    expect(toggleSpy).toHaveBeenCalledWith(mockCompletedTodo);

    component.onUpdateText('todo-c1', 'New text');
    expect(updateSpy).toHaveBeenCalledWith({ todoId: 'todo-c1', text: 'New text' });

    component.onDeleteTodo(mockCompletedTodo);
    expect(deleteSpy).toHaveBeenCalledWith(mockCompletedTodo);
  });

  it('renders empty state message when expanded with 0 items and not loading', () => {
    componentRef.setInput('isExpanded', true);
    componentRef.setInput('completedTodos', []);
    componentRef.setInput('completedCount', 0);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No completed tasks yet.');
  });

  it('renders initial loading state when expanded with 0 items and isLoading is true', () => {
    componentRef.setInput('isExpanded', true);
    componentRef.setInput('completedTodos', []);
    componentRef.setInput('isLoading', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Loading completed tasks...');
  });

  it('renders sentinel and emits loadMore when hasMore is true', () => {
    const loadMoreSpy = vi.fn();
    component.loadMore.subscribe(loadMoreSpy);

    componentRef.setInput('isExpanded', true);
    componentRef.setInput('hasMore', true);
    fixture.detectChanges();

    const sentinel = fixture.nativeElement.querySelector('[appInfiniteScrollSentinel]');
    expect(sentinel).toBeTruthy();

    component.onLoadMore();
    expect(loadMoreSpy).toHaveBeenCalled();
  });

  it('renders search-specific empty state and badge count during search', () => {
    componentRef.setInput('isExpanded', true);
    componentRef.setInput('isSearchActive', true);
    componentRef.setInput('completedTodos', []);
    componentRef.setInput('completedCount', 10);
    componentRef.setInput('searchQuery', 'milk');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('[hlmBadge]') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('0');
    expect(fixture.nativeElement.textContent).toContain('No completed tasks match that filter.');
  });
});
