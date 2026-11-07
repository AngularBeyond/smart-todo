import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { generateUser } from '../../fixtures/test-data';

test.describe('Registration & Seed Data E2E', () => {
  test('registers successfully, redirects to workspace, and renders seeded "My Tasks" list', async ({ page }) => {
    const authPage = new AuthPage(page);
    const user = generateUser('reg_success');

    await authPage.gotoRegister();
    await authPage.register(user);

    // Should redirect away from /signup to /
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Workspace list title should show default list name
    const listTitle = page.locator('app-list-header h1, h1');
    await expect(listTitle).toContainText('My Tasks');

    // Should display the 4 seeded active tasks
    const activeRows = page.locator('app-todo-item-row');
    await expect(activeRows).toHaveCount(4);
    await expect(page.getByText('Welcome! Click or tap on any task text to edit it inline.')).toBeVisible();
    await expect(page.getByText('Use the drag handle on the left to reorder your active tasks.')).toBeVisible();

    // Completed section badge should show 1 completed task
    const completedBadge = page.locator('app-completed-section [hlmBadge]');
    await expect(completedBadge).toHaveText('1');

    // Progress box should indicate 1/5 completed
    await expect(page.getByText('1/5')).toBeVisible();
  });

  test('rejects duplicate email registration with a 409 Conflict alert banner', async ({ page, context }) => {
    const authPage = new AuthPage(page);
    const user = generateUser('duplicate');

    // Register first user
    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Create a new browser tab/page without cookies to attempt duplicate registration
    const newPage = await context.newPage();
    const newAuthPage = new AuthPage(newPage);

    await newAuthPage.gotoRegister();
    await newAuthPage.register(user);

    // Should stay on signup and show error banner
    await expect(newPage).toHaveURL(/\/signup/);
    await expect(newAuthPage.alertBanner).toBeVisible();
    await expect(newAuthPage.alertDescription).toContainText('An account with this email already exists.');

    await newPage.close();
  });

  test('disables register button when required fields are empty', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoRegister();

    // Form button should be disabled initially
    await expect(authPage.registerSubmitButton).toBeDisabled();

    // Fill only name
    await authPage.nameInput.fill('Alex');
    await expect(authPage.registerSubmitButton).toBeDisabled();

    // Fill invalid email
    await authPage.emailInput.fill('invalid-email');
    await expect(authPage.registerSubmitButton).toBeDisabled();

    // Fill short password (< 8 chars)
    await authPage.passwordInput.fill('short');
    await expect(authPage.registerSubmitButton).toBeDisabled();
  });
});
