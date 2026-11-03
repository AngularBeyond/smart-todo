import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
import {
  loadTodoLists,
  selectTodoList,
  toggleStarTodoList,
  TodoListSummary,
  TodoListsStore,
  userLogout,
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

  it('should render Profile link pointing to /profile and not render Tags link', () => {
    const profileLink = element.querySelector<HTMLAnchorElement>('a[routerLink="/profile"]');
    expect(profileLink).toBeTruthy();
    expect(profileLink?.textContent).toContain('Profile');

    const tagsLink = element.querySelector<HTMLAnchorElement>('a[routerLink="/tags"]');
    expect(tagsLink).toBeNull();
  });

  it('should render Settings link pointing to /settings', () => {
    const settingsLink = element.querySelector<HTMLAnchorElement>('a[routerLink="/settings"]');
    expect(settingsLink).toBeTruthy();
    expect(settingsLink?.textContent).toContain('Settings');
  });

  it('should render Logout button and dispatch userLogout when clicked', () => {
    const logoutBtn = Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find((btn) =>
      btn.textContent?.includes('Logout'),
    );
    expect(logoutBtn).toBeTruthy();

    logoutBtn?.click();
    expect(dispatcher.dispatch).toHaveBeenCalledWith(userLogout());
  });

  it('should call dispatcher.dispatch with userLogout on logout() call', () => {
    component.logout();
    expect(dispatcher.dispatch).toHaveBeenCalledWith(userLogout());
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

  it('should dispatch selectTodoList when a list item is clicked', () => {
    component.selectList('list-2');
    expect(dispatcher.dispatch).toHaveBeenCalledWith(selectTodoList({ listId: 'list-2' }));
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
});

