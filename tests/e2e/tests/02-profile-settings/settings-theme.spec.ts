import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { SettingsPage } from '../../pages/settings.page';
import { generateUser } from '../../fixtures/test-data';

test.describe('Settings & Theme Persistence E2E', () => {
  test('toggles theme in Settings page appearance section and persists across page reloads', async ({ page }) => {
    const authPage = new AuthPage(page);
    const settingsPage = new SettingsPage(page);
    const user = generateUser('theme_settings');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Navigate to /settings
    await settingsPage.gotoSettings();
    await expect(page).toHaveURL(/\/settings/);
    await expect(settingsPage.heading).toBeVisible();

    const html = page.locator('html');

    // Initially light theme: <html> should not contain 'dark'
    await expect(html).not.toHaveClass(/dark/);

    // Select Dark theme in appearance options
    await settingsPage.selectTheme('dark');
    await expect(html).toHaveClass(/dark/);
    await expect(settingsPage.darkThemeButton).toHaveClass(/border-primary/);

    // Reload page to verify theme persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(html).toHaveClass(/dark/);
    await expect(settingsPage.darkThemeButton).toHaveClass(/border-primary/);

    // Switch back to Light theme
    await settingsPage.selectTheme('light');
    await expect(html).not.toHaveClass(/dark/);
    await expect(settingsPage.lightThemeButton).toHaveClass(/border-primary/);

    // Reload page again to verify light theme persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(html).not.toHaveClass(/dark/);
    await expect(settingsPage.lightThemeButton).toHaveClass(/border-primary/);
  });

  test('toggles theme via top header icon button and retains state across workspace navigation', async ({ page }) => {
    const authPage = new AuthPage(page);
    const settingsPage = new SettingsPage(page);
    const user = generateUser('theme_header');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    const html = page.locator('html');

    // Initially light theme
    await expect(html).not.toHaveClass(/dark/);

    // Toggle theme to dark via header button
    await settingsPage.themeToggleButton.click();
    await expect(html).toHaveClass(/dark/);

    // Reload workspace
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(html).toHaveClass(/dark/);

    // Toggle back to light via header button
    await settingsPage.themeToggleButton.click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test('toggles workspace notification preference badge in settings page', async ({ page }) => {
    const authPage = new AuthPage(page);
    const settingsPage = new SettingsPage(page);
    const user = generateUser('settings_notif');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    await settingsPage.gotoSettings();

    // Check initial state
    const initialText = (await settingsPage.notificationsBadge.textContent())?.trim();
    const expectedToggledText = initialText === 'On' ? 'Off' : 'On';

    // Click to toggle
    await settingsPage.toggleNotifications();
    await expect(settingsPage.notificationsBadge).toHaveText(expectedToggledText);

    // Click again to toggle back
    await settingsPage.toggleNotifications();
    await expect(settingsPage.notificationsBadge).toHaveText(initialText || 'Off');
  });
});
