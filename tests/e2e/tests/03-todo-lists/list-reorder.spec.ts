import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { WorkspacePage } from '../../pages/workspace.page';
import { generateUser } from '../../fixtures/test-data';

test.describe('Todo Lists CDK Drag and Drop Reordering E2E', () => {
  test('reorders unstarred lists via drag handle and persists order across reload', async ({ page }) => {
    const authPage = new AuthPage(page);
    const workspacePage = new WorkspacePage(page);
    const user = generateUser('list_reorder');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Initial list: "My Tasks"
    // Create 2nd list "Work Projects"
    await workspacePage.sidebar.createList('Work Projects');
    await expect(workspacePage.sidebar.getUnstarredItem('Work Projects')).toBeVisible();

    // Create 3rd list "Personal Life"
    await workspacePage.sidebar.createList('Personal Life');
    await expect(workspacePage.sidebar.getUnstarredItem('Personal Life')).toBeVisible();

    // Initial order should be: ['My Tasks', 'Work Projects', 'Personal Life']
    let unstarred = await workspacePage.sidebar.getUnstarredListNames();
    expect(unstarred).toEqual(['My Tasks', 'Work Projects', 'Personal Life']);

    // Find drag handle for first item ("My Tasks") and target second item ("Work Projects")
    const myTasksItem = workspacePage.sidebar.getUnstarredItem('My Tasks');
    const workProjectsItem = workspacePage.sidebar.getUnstarredItem('Work Projects');

    const dragHandle = myTasksItem.locator('button[aria-label="Reorder list"]');
    const handleBox = await dragHandle.boundingBox();
    const targetBox = await workProjectsItem.boundingBox();
    expect(handleBox).not.toBeNull();
    expect(targetBox).not.toBeNull();

    if (handleBox && targetBox) {
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      // Move downward to activate drag
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + 15, { steps: 10 });
      await page.waitForTimeout(100);
      // Move below the midpoint of target item
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height - 5, { steps: 20 });
      await page.waitForTimeout(100);
      await page.mouse.up();
      await page.waitForLoadState('networkidle');
    }

    // Verify reordered list order: "Work Projects" is now first
    await expect(workspacePage.sidebar.unstarredDropList.locator('[cdkdrag]').first()).toContainText('Work Projects');
    unstarred = await workspacePage.sidebar.getUnstarredListNames();
    expect(unstarred[0]).toBe('Work Projects');

    // Reload page to verify backend database order persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    const reloadedOrder = await workspacePage.sidebar.getUnstarredListNames();
    expect(reloadedOrder[0]).toBe('Work Projects');
  });
});
