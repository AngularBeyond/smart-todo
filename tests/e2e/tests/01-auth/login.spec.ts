import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { generateUser } from '../../fixtures/test-data';

test.describe('Login & Throttling E2E', () => {
  test('logs in successfully with valid credentials and redirects to workspace', async ({ page }) => {
    const authPage = new AuthPage(page);
    const user = generateUser('login_valid');

    // Register user first
    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Logout to test login form
    await authPage.logout();
    await expect(page).toHaveURL(/\/login/);

    // Fill valid credentials
    await authPage.login(user.email, user.password);

    // Should redirect to workspace
    await expect(page).toHaveURL(/\/(\?.*)?$/);
    await expect(authPage.profileMenuButton).toBeVisible();
    await expect(page.locator('app-list-header h1, h1')).toContainText('My Tasks');
  });

  test('displays 401 Unauthorized alert on invalid password', async ({ page }) => {
    const authPage = new AuthPage(page);
    const user = generateUser('login_bad_pw');

    // Register user first
    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Logout
    await authPage.logout();
    await expect(page).toHaveURL(/\/login/);

    // Attempt login with incorrect password
    await authPage.login(user.email, 'WrongPassword123!');

    // Stays on /login and shows destructive error alert
    await expect(page).toHaveURL(/\/login/);
    await expect(authPage.alertBanner).toBeVisible();
    await expect(authPage.alertDescription).toContainText('Invalid email or password.');
  });

  test('enforces rate limiting (429 Too Many Requests) on the 6th rapid login attempt', async ({ page }) => {
    const authPage = new AuthPage(page);
    const user = generateUser('throttle');

    await authPage.gotoLogin();

    // 5 attempts are allowed (will fail with 401 for non-existent credentials)
    for (let i = 1; i <= 5; i++) {
      await authPage.login(user.email, `AttemptPass_${i}`);
      await expect(authPage.alertBanner).toBeVisible();
      await expect(authPage.alertDescription).toContainText('Invalid email or password.');
    }

    // Intercept 6th rapid attempt to verify rate limit error handling (429 Too Many Requests)
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 429,
          message: 'ThrottlerException: Too Many Requests',
        }),
      }),
    );
    await authPage.login(user.email, 'AttemptPass_6');
    await expect(authPage.alertBanner).toBeVisible();
    await expect(authPage.alertDescription).toContainText(/Too Many Requests/i);
  });
});
