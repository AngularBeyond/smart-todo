import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
import {
  createTodoList,
  loadTodoLists,
  reorderUnstarredList,
  selectTodoList,
  toggleStarTodoList,
  TodoListSummary,
  TodoListsStore,
} from '@core';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let fixture: ComponentFixture<Sidebar>;
  let component: Sidebar;
  let element: HTMLElement;
  let dispatcher: Dispatcher;

  const mockLists = signal<TodoListSummary[]>([
    {
      id: 'list-1',
      name: 'Work Tasks',
      isStarred: true,
      order: 1000,
      totalCount: 5,
      activeCount: 3,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'list-2',
      name: 'Personal',
      isStarred: false,
      order: 2000,
      totalCount: 2,
      activeCount: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ]);

  const mockStarredLists = signal<TodoListSummary[]>([mockLists()[0]]);
  const mockUnstarredLists = signal<TodoListSummary[]>([mockLists()[1]]);
  const mockSelectedListId = signal<string | null>('list-1');
  const mockIsQuotaReached = signal<boolean>(false);

  const mockTodoListsStore = {
    lists: mockLists.asReadonly(),
    starredLists: mockStarredLists.asReadonly(),
    unstarredLists: mockUnstarredLists.asReadonly(),
    selectedListId: mockSelectedListId.asReadonly(),
    isQuotaReached: mockIsQuotaReached.asReadonly(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        provideRouter([]),
        provideDispatcher(),
        { provide: TodoListsStore, useValue: mockTodoListsStore },
      ],
    }).compileComponents();

    dispatcher = TestBed.inject(Dispatcher);
    vi.spyOn(dispatcher, 'dispatch');

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render About menu button in sidebar footer', () => {
    const aboutBtn = Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find((btn) =>
      btn.textContent?.includes('About'),
    );
    expect(aboutBtn).toBeTruthy();
  });

  it('should render All tasks without count badge', () => {
    const allTasksBtn = Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find((btn) =>
      btn.textContent?.includes('All tasks'),
    );
    expect(allTasksBtn).toBeTruthy();
    expect(allTasksBtn?.textContent?.trim()).toBe('All tasks');
  });

  it('should not render Profile, Settings, or Logout links in sidebar footer', () => {
    const profileLink = element.querySelector<HTMLAnchorElement>('a[routerLink="/profile"]');
    const settingsLink = element.querySelector<HTMLAnchorElement>('a[routerLink="/settings"]');
    const logoutBtn = Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find((btn) =>
      btn.textContent?.includes('Logout'),
    );
    expect(profileLink).toBeNull();
    expect(settingsLink).toBeNull();
    expect(logoutBtn).toBeUndefined();
  });

  it('should have label associated with new-list-input', () => {
    const label = element.querySelector<HTMLLabelElement>('label[for="new-list-input"]');
    const input = element.querySelector<HTMLInputElement>('#new-list-input');
    expect(label).toBeTruthy();
    expect(input).toBeTruthy();
    expect(label?.textContent?.trim()).toBe('New list');
  });

  it('should render starred lists section and unstarred lists', () => {
    expect(element.textContent).toContain('Starred');
    expect(element.textContent).toContain('Work Tasks');
    expect(element.textContent).toContain('Personal');
  });

  it('should dispatch selectTodoList and navigate to / when a list item is clicked', () => {
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate');

    component.selectList('list-2');
    expect(dispatcher.dispatch).toHaveBeenCalledWith(selectTodoList({ listId: 'list-2' }));
    expect(navSpy).toHaveBeenCalledWith(['/']);
  });

  it('should dispatch toggleStarTodoList when star toggle button is clicked', () => {
    const mouseEvent = new MouseEvent('click');
    vi.spyOn(mouseEvent, 'stopPropagation');

    component.toggleStar('list-1', mouseEvent);

    expect(mouseEvent.stopPropagation).toHaveBeenCalled();
    expect(dispatcher.dispatch).toHaveBeenCalledWith(toggleStarTodoList({ listId: 'list-1' }));
  });

  it('should dispatch loadTodoLists on init if store lists are empty', () => {
    const emptyStore = {
      lists: signal([]).asReadonly(),
      starredLists: signal([]).asReadonly(),
      unstarredLists: signal([]).asReadonly(),
      selectedListId: signal(null).asReadonly(),
      isQuotaReached: signal(false).asReadonly(),
    };

    const emptyFixture = TestBed.createComponent(Sidebar);
    (emptyFixture.componentInstance as any).todoListsStore = emptyStore;
    emptyFixture.componentInstance.ngOnInit();

    expect(dispatcher.dispatch).toHaveBeenCalledWith(loadTodoLists());
  });

  it('should dispatch reorderUnstarredList on onDrop when index changes', () => {
    const dropEvent = {
      previousIndex: 0,
      currentIndex: 1,
    } as any;

    component.onDrop(dropEvent);

    expect(dispatcher.dispatch).toHaveBeenCalledWith(
      reorderUnstarredList({
        listId: 'list-2',
        targetIndex: 1,
      }),
    );
  });

  it('should not dispatch reorderUnstarredList if dropped at same index', () => {
    const dropEvent = {
      previousIndex: 0,
      currentIndex: 0,
    } as any;

    component.onDrop(dropEvent);

    expect(dispatcher.dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: '[Todo Lists] Reorder Unstarred List' }),
    );
  });

  it('should dispatch createTodoList when createList() is called with valid name', () => {
    component.newListName.set(' Groceries ');
    component.createList();

    expect(dispatcher.dispatch).toHaveBeenCalledWith(
      createTodoList({ name: 'Groceries' }),
    );
    expect(component.newListName()).toBe('');
  });

  it('should not dispatch createTodoList when newListName is blank', () => {
    component.newListName.set('   ');
    component.createList();

    expect(dispatcher.dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: '[Todo Lists] Create List' }),
    );
  });

  it('should not dispatch createTodoList and should show quota UI when quota is reached', async () => {
    const quotaStore = {
      lists: signal([mockLists()[0], mockLists()[1], { ...mockLists()[1], id: 'list-3' }]).asReadonly(),
      starredLists: signal([]).asReadonly(),
      unstarredLists: signal([]).asReadonly(),
      selectedListId: signal(null).asReadonly(),
      isQuotaReached: signal(true).asReadonly(),
    };

    const quotaFixture = TestBed.createComponent(Sidebar);
    (quotaFixture.componentInstance as any).todoListsStore = quotaStore;
    quotaFixture.detectChanges();
    await quotaFixture.whenStable();

    const input = quotaFixture.nativeElement.querySelector('#new-list-input') as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.placeholder).toBe('Max 3 lists in demo (3/3)');
    expect(quotaFixture.nativeElement.textContent).toContain('Max 3 lists in demo (3/3)');

    quotaFixture.componentInstance.newListName.set('Another List');
    quotaFixture.componentInstance.createList();

    expect(dispatcher.dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: '[Todo Lists] Create List' }),
    );
  });
});

