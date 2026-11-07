import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { WorkspacePage } from '../../pages/workspace.page';
import { generateUser } from '../../fixtures/test-data';

test.describe('Todo Lists Management & CRUD E2E', () => {
  test('creates a new list, selects it automatically, and persists in database', async ({ page }) => {
    const authPage = new AuthPage(page);
    const workspacePage = new WorkspacePage(page);
    const user = generateUser('list_create');

    // Register user and land on workspace
    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Initial state: default seeded list "My Tasks" (1/3 used)
    await expect(workspacePage.listHeaderTitleButton).toHaveText('My Tasks');
    await expect(workspacePage.sidebar.quotaIndicator).toContainText('1/3 used');

    // Create a second list "Project Roadmap"
    await workspacePage.sidebar.createList('Project Roadmap');

    // Verify list added to sidebar and auto-selected
    const unstarred = await workspacePage.sidebar.getUnstarredListNames();
    expect(unstarred).toContain('Project Roadmap');
    await expect(workspacePage.listHeaderTitleButton).toHaveText('Project Roadmap');
    await expect(workspacePage.sidebar.quotaIndicator).toContainText('2/3 used');

    // Reload page to verify backend database persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(workspacePage.sidebar.getUnstarredItem('Project Roadmap')).toBeVisible();
    await workspacePage.sidebar.selectList('Project Roadmap');
    await expect(workspacePage.listHeaderTitleButton).toHaveText('Project Roadmap');
  });

  test('renames list via single-click inline edit with auto-focus and cancels on Escape', async ({ page }) => {
    const authPage = new AuthPage(page);
    const workspacePage = new WorkspacePage(page);
    const user = generateUser('list_rename');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Create list "Sprint Backlog"
    await workspacePage.sidebar.createList('Sprint Backlog');
    await expect(workspacePage.listHeaderTitleButton).toHaveText('Sprint Backlog');

    // Test Escape cancellation
    await workspacePage.startEditingTitle();
    await expect(workspacePage.listTitleEditInput).toBeFocused();
    await workspacePage.listTitleEditInput.fill('Discarded Name');
    await workspacePage.listTitleEditInput.press('Escape');
    await expect(workspacePage.listHeaderTitleButton).toHaveText('Sprint Backlog');

    // Test successful inline renaming with Enter
    await workspacePage.renameList('Sprint 42 Plan');

    // Verify workspace header and sidebar sync
    await expect(workspacePage.listHeaderTitleButton).toHaveText('Sprint 42 Plan');
    await expect(workspacePage.sidebar.getUnstarredItem('Sprint 42 Plan')).toBeVisible();

    // Reload page to verify database persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(workspacePage.sidebar.getUnstarredItem('Sprint 42 Plan')).toBeVisible();
    await workspacePage.sidebar.selectList('Sprint 42 Plan');
    await expect(workspacePage.listHeaderTitleButton).toHaveText('Sprint 42 Plan');
  });

  test('deletes list via confirmation modal, restores fallback list, and updates quota', async ({ page }) => {
    const authPage = new AuthPage(page);
    const workspacePage = new WorkspacePage(page);
    const user = generateUser('list_delete');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Create a second list to delete
    await workspacePage.sidebar.createList('Temporary Notes');
    await expect(workspacePage.listHeaderTitleButton).toHaveText('Temporary Notes');
    await expect(workspacePage.sidebar.quotaIndicator).toContainText('2/3 used');

    // Open delete dialog and test Cancel button
    await workspacePage.deleteListButton.click();
    await expect(workspacePage.alertDialogContent).toBeVisible();
    await expect(page.locator('h2[hlmalertdialogtitle]')).toContainText('Delete "Temporary Notes"?');
    await workspacePage.cancelDeleteButton.click();
    await expect(workspacePage.alertDialogContent).toBeHidden();
    await expect(workspacePage.sidebar.getUnstarredItem('Temporary Notes')).toBeVisible();

    // Confirm deletion
    await workspacePage.deleteCurrentList();

    // Verify list is removed from sidebar
    await expect(workspacePage.sidebar.getUnstarredItem('Temporary Notes')).toBeHidden();
    await expect(workspacePage.sidebar.quotaIndicator).toContainText('1/3 used');

    // Verify auto-selection fallback to "My Tasks"
    await expect(workspacePage.listHeaderTitleButton).toHaveText('My Tasks');

    // Reload page to ensure deletion persisted in database
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(workspacePage.sidebar.getUnstarredItem('Temporary Notes')).toBeHidden();
    await expect(workspacePage.listHeaderTitleButton).toHaveText('My Tasks');
  });
});
