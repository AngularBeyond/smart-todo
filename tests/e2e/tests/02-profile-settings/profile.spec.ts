import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { ProfilePage } from '../../pages/profile.page';
import { generateUser } from '../../fixtures/test-data';

test.describe('Profile Management E2E', () => {
  test('updates first and last name and synchronizes display name in real-time across header and profile badges', async ({ page }) => {
    const authPage = new AuthPage(page);
    const profilePage = new ProfilePage(page);
    const user = generateUser('profile_sync');

    // Register user and land on workspace
    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Navigate to profile page
    await profilePage.gotoProfile();
    await expect(page).toHaveURL(/\/profile/);
    await expect(profilePage.heading).toBeVisible();

    // Verify initial values in inputs
    await expect(profilePage.firstNameInput).toHaveValue(user.name);
    await expect(profilePage.lastNameInput).toHaveValue(user.lastName);
    await expect(profilePage.emailInput).toHaveValue(user.email);

    // Update name to 'Grace' and 'Hopper'
    await profilePage.updateName('Grace', 'Hopper');

    // Verify updated badges on the profile page
    await expect(profilePage.fullNameBadge).toHaveText('Grace Hopper');
    await expect(profilePage.initialsBadge).toHaveText('GH');

    // Verify header avatar button immediately synchronizes initials
    await expect(profilePage.profileMenuButton).toHaveText('GH');

    // Open profile menu in header and verify updated full name
    await profilePage.openProfileMenu();
    await expect(page.locator('header span:has-text("Grace Hopper")')).toBeVisible();

    // Reload page and verify persistence from database
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(profilePage.firstNameInput).toHaveValue('Grace');
    await expect(profilePage.lastNameInput).toHaveValue('Hopper');
    await expect(profilePage.fullNameBadge).toHaveText('Grace Hopper');
    await expect(profilePage.initialsBadge).toHaveText('GH');
    await expect(profilePage.profileMenuButton).toHaveText('GH');
  });

  test('validates password mismatch and rejects invalid current password with error banner', async ({ page }) => {
    const authPage = new AuthPage(page);
    const profilePage = new ProfilePage(page);
    const user = generateUser('profile_pw_err');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    await profilePage.gotoProfile();

    // 1. Client-side password mismatch
    await profilePage.changePassword(user.password, 'NewValidPass123!', 'MismatchPass999!');
    await expect(profilePage.passwordAlert).toBeVisible();
    await expect(profilePage.passwordAlertDescription).toContainText('New passwords do not match.');

    // 2. Server-side rejection on incorrect current password
    await profilePage.changePassword('WrongOldPassword123!', 'NewValidPass123!', 'NewValidPass123!');
    await expect(profilePage.passwordAlert).toBeVisible();
    await expect(profilePage.passwordAlertDescription).toContainText(/current password/i);
  });

  test('changes password successfully, invalidates old password, and authenticates with new password', async ({ page }) => {
    const authPage = new AuthPage(page);
    const profilePage = new ProfilePage(page);
    const user = generateUser('profile_pw_ok');
    const newPassword = 'BrandNewSecurePass789!';

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    await profilePage.gotoProfile();

    // Change password with correct credentials
    await profilePage.changePassword(user.password, newPassword, newPassword);

    // Verify success alert banner
    await expect(page.locator('app-change-password-form [hlmAlertTitle]:has-text("Success")')).toBeVisible();

    // Logout
    await profilePage.logout();
    await expect(page).toHaveURL(/\/login/);

    // Attempt login with old password -> should fail
    await authPage.login(user.email, user.password);
    await expect(authPage.alertBanner).toBeVisible();
    await expect(authPage.alertDescription).toContainText('Invalid email or password.');

    // Attempt login with new password -> should succeed
    await authPage.login(user.email, newPassword);
    await expect(page).toHaveURL(/\/(\?.*)?$/);
    await expect(authPage.profileMenuButton).toBeVisible();
    await expect(page.locator('app-list-header h1, h1')).toContainText('My Tasks');
  });
});
