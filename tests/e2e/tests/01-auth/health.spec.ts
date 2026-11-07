import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';

test.describe('E2E Infrastructure Health Check', () => {
  test('loads login page and renders sign in form', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();

    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.loginSubmitButton).toBeVisible();
  });

  test('navigates to signup page and renders registration form', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoRegister();

    await expect(authPage.nameInput).toBeVisible();
    await expect(authPage.lastNameInput).toBeVisible();
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.registerSubmitButton).toBeVisible();
  });
});
