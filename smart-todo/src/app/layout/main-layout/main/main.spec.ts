import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
import { AppStore, setMobileSidebarOpen, TodoListsStore } from '@core';
import { Main } from './main';

describe('Main Layout', () => {
  let fixture: ComponentFixture<Main>;
  let component: Main;
  let element: HTMLElement;
  let dispatcher: Dispatcher;

  const mockIsMobileSidebarOpen = signal<boolean>(false);
  const mockAppStore = {
    theme: signal<'light' | 'dark'>('light').asReadonly(),
    userInitials: signal('JD').asReadonly(),
    isMobileSidebarOpen: mockIsMobileSidebarOpen.asReadonly(),
  };

  const mockTodoListsStore = {
    lists: signal([]).asReadonly(),
    starredLists: signal([]).asReadonly(),
    unstarredLists: signal([]).asReadonly(),
    selectedListId: signal(null).asReadonly(),
    isQuotaReached: signal(false).asReadonly(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Main],
      providers: [
        provideRouter([]),
        provideDispatcher(),
        { provide: AppStore, useValue: mockAppStore },
        { provide: TodoListsStore, useValue: mockTodoListsStore },
      ],
    }).compileComponents();

    dispatcher = TestBed.inject(Dispatcher);
    vi.spyOn(dispatcher, 'dispatch');

    fixture = TestBed.createComponent(Main);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the main layout component', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch setMobileSidebarOpen on onOpenChange', () => {
    component.onOpenChange(true);
    expect(dispatcher.dispatch).toHaveBeenCalledWith(setMobileSidebarOpen({ isOpen: true }));

    component.onOpenChange(false);
    expect(dispatcher.dispatch).toHaveBeenCalledWith(setMobileSidebarOpen({ isOpen: false }));
  });
});
