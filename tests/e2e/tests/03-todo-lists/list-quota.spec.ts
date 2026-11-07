import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { WorkspacePage } from '../../pages/workspace.page';
import { generateUser } from '../../fixtures/test-data';

test.describe('Todo Lists 3-List Quota Boundary E2E', () => {
  test('enforces max 3 lists quota, disables input/button, and re-enables upon deletion', async ({ page }) => {
    const authPage = new AuthPage(page);
    const workspacePage = new WorkspacePage(page);
    const user = generateUser('list_quota');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Initial state: 1 seeded list ("My Tasks")
    await expect(workspacePage.sidebar.quotaIndicator).toContainText('1/3 used');
    await expect(workspacePage.sidebar.newListInput).toBeEnabled();
    await expect(workspacePage.sidebar.newListInput).toHaveAttribute('placeholder', 'Name your list');

    // Create 2nd list
    await workspacePage.sidebar.createList('Second List');
    await expect(workspacePage.sidebar.quotaIndicator).toContainText('2/3 used');
    await expect(workspacePage.sidebar.newListInput).toBeEnabled();

    // Create 3rd list (Quota boundary reached)
    await workspacePage.sidebar.createList('Third List');
    await expect(workspacePage.sidebar.quotaIndicator).toContainText('Max 3 lists in demo (3/3)');

    // Verify input and create button are disabled
    await expect(workspacePage.sidebar.newListInput).toBeDisabled();
    await expect(workspacePage.sidebar.newListInput).toHaveAttribute('placeholder', 'Max 3 lists in demo (3/3)');
    await expect(workspacePage.sidebar.createListButton).toBeDisabled();

    // Verify persistence across reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(workspacePage.sidebar.quotaIndicator).toContainText('Max 3 lists in demo (3/3)');
    await expect(workspacePage.sidebar.newListInput).toBeDisabled();
    await expect(workspacePage.sidebar.createListButton).toBeDisabled();

    // Delete "Third List" to release quota
    await workspacePage.sidebar.selectList('Third List');
    await workspacePage.deleteCurrentList();

    // Verify quota returns to 2/3 used and controls re-enable
    await expect(workspacePage.sidebar.quotaIndicator).toContainText('2/3 used');
    await expect(workspacePage.sidebar.newListInput).toBeEnabled();
    await expect(workspacePage.sidebar.newListInput).toHaveAttribute('placeholder', 'Name your list');
  });
});
