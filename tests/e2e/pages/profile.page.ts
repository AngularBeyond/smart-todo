import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class ProfilePage extends BasePage {
  readonly heading: Locator;
  readonly fullNameBadge: Locator;
  readonly initialsBadge: Locator;

  // Personal details form
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly saveProfileButton: Locator;
  readonly profileAlert: Locator;

  // Password form
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly changePasswordButton: Locator;
  readonly passwordAlert: Locator;
  readonly passwordAlertDescription: Locator;

  readonly backToTasksLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('h1:has-text("Profile")');
    this.fullNameBadge = page.locator('app-profile-page div:has(.size-14) p.font-medium');
    this.initialsBadge = page.locator('app-profile-page .size-14');

    this.firstNameInput = page.locator('input#profile-name');
    this.lastNameInput = page.locator('input#profile-lastName');
    this.emailInput = page.locator('input#profile-email');
    this.saveProfileButton = page.locator('app-profile-form button[type="submit"]');
    this.profileAlert = page.locator('app-profile-form [hlmAlert]');

    this.currentPasswordInput = page.locator('input#current-password');
    this.newPasswordInput = page.locator('input#new-password');
    this.confirmPasswordInput = page.locator('input#confirm-password');
    this.changePasswordButton = page.locator('app-change-password-form button[type="submit"]');
    this.passwordAlert = page.locator('app-change-password-form [hlmAlert]');
    this.passwordAlertDescription = page.locator('app-change-password-form [hlmAlertDescription]');

    this.backToTasksLink = page.locator('a:has-text("Back to tasks")');
  }

  async gotoProfile(): Promise<void> {
    // If not already on /profile, navigate via profile menu or direct URL
    if (!this.page.url().includes('/profile')) {
      if (await this.profileMenuButton.isVisible()) {
        await this.openProfileMenu();
        await this.page.locator('a[routerLink="/profile"], a:has-text("Profile")').click();
      } else {
        await this.goto('/profile');
      }
    }
    await this.page.waitForURL(/\/profile/);
    await this.heading.waitFor({ state: 'visible' });
  }

  async updateName(firstName: string, lastName: string): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.saveProfileButton.click();
  }

  async changePassword(currentPass: string, newPass: string, confirmPass: string): Promise<void> {
    await this.currentPasswordInput.fill(currentPass);
    await this.newPasswordInput.fill(newPass);
    await this.confirmPasswordInput.fill(confirmPass);
    await this.changePasswordButton.click();
  }
}
