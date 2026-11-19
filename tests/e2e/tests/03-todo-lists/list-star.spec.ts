import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { WorkspacePage } from '../../pages/workspace.page';
import { generateUser } from '../../fixtures/test-data';

test.describe('Todo Lists Starring & Pinning E2E', () => {
  test('stars a list, pins it to top Starred section, and persists across reload', async ({ page }) => {
    const authPage = new AuthPage(page);
    const workspacePage = new WorkspacePage(page);
    const user = generateUser('list_star');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Create a new list "Design System"
    await workspacePage.sidebar.createList('Design System');
    await expect(workspacePage.sidebar.getUnstarredItem('Design System')).toBeVisible();

    // Star the list via sidebar star button
    await workspacePage.sidebar.toggleStar('Design System');

    // Verify it is moved to Starred section
    await expect(workspacePage.sidebar.getStarredItem('Design System')).toBeVisible();
    await expect(workspacePage.sidebar.getUnstarredItem('Design System')).toBeHidden();

    // Reload page to verify backend database persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(workspacePage.sidebar.getStarredItem('Design System')).toBeVisible();
    await expect(workspacePage.sidebar.getUnstarredItem('Design System')).toBeHidden();

    // Unstar the list via sidebar unstar button
    await workspacePage.sidebar.toggleStar('Design System');

    // Verify it moves back to Unstarred section
    await expect(workspacePage.sidebar.getStarredItem('Design System')).toBeHidden();
    await expect(workspacePage.sidebar.getUnstarredItem('Design System')).toBeVisible();

    // Reload page to verify unstarred state persists
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(workspacePage.sidebar.getStarredItem('Design System')).toBeHidden();
    await expect(workspacePage.sidebar.getUnstarredItem('Design System')).toBeVisible();
  });

  test('toggles star via workspace header star button and synchronizes with sidebar', async ({ page }) => {
    const authPage = new AuthPage(page);
    const workspacePage = new WorkspacePage(page);
    const user = generateUser('list_star_hdr');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Initial default list "My Tasks" is selected and unstarred
    await expect(workspacePage.listHeaderTitleButton).toHaveText('My Tasks');
    const headerStarBtn = page.locator('button[aria-label="Add to favorites"], button[aria-label="Star list"]').first();
    await expect(headerStarBtn).toBeVisible();

    // Click header star button
    await headerStarBtn.click();
    await page.waitForLoadState('networkidle');

    // Header star button aria-label should switch to "Remove from favorites"
    const headerUnstarBtn = page.locator('button[aria-label="Remove from favorites"], button[aria-label="Unstar list"]').first();
    await expect(headerUnstarBtn).toBeVisible();

    // Verify sidebar shows "My Tasks" in Starred section
    await expect(workspacePage.sidebar.getStarredItem('My Tasks')).toBeVisible();

    // Unstar via header button
    await headerUnstarBtn.click();
    await page.waitForLoadState('networkidle');

    // Verify moved back to unstarred
    await expect(workspacePage.sidebar.getUnstarredItem('My Tasks')).toBeVisible();
  });
});
