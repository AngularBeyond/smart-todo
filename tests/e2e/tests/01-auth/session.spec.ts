import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { generateUser } from '../../fixtures/test-data';

test.describe('Session & Route Guards E2E', () => {
  test('persists session across page reloads via refresh token cookie', async ({ page }) => {
    const authPage = new AuthPage(page);
    const user = generateUser('session');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Should remain on workspace, not redirected to /login
    await expect(page).toHaveURL(/\/(\?.*)?$/);
    await expect(authPage.profileMenuButton).toBeVisible();
    await expect(page.locator('app-list-header h1, h1')).toContainText('My Tasks');
  });

  test('clears session on logout and blocks unauthenticated access to protected routes', async ({ page }) => {
    const authPage = new AuthPage(page);
    const user = generateUser('guard');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Logout
    await authPage.logout();
    await expect(page).toHaveURL(/\/login/);

    // Try navigating to protected root route
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);

    // Try navigating to protected profile route
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);

    // Try navigating to protected settings route
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });
});
