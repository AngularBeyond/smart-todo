import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class SettingsPage extends BasePage {
  readonly heading: Locator;
  readonly lightThemeButton: Locator;
  readonly darkThemeButton: Locator;
  readonly notificationsButton: Locator;
  readonly notificationsBadge: Locator;
  readonly backToTasksLink: Locator;
  readonly workspacePreferencesCard: Locator;
  readonly taskDefaultsCard: Locator;
  readonly allowedListsBadge: Locator;
  readonly dailyTaskLimitBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('h1:has-text("Settings")');
    this.lightThemeButton = page.locator('button:has-text("Light")');
    this.darkThemeButton = page.locator('button:has-text("Dark")');
    this.notificationsButton = page.locator('button:has-text("Notifications")');
    this.notificationsBadge = page.locator('button:has-text("Notifications") [hlmBadge]');
    this.backToTasksLink = page.locator('a:has-text("Back to tasks")');
    this.workspacePreferencesCard = page.locator('section:has-text("Workspace preferences")');
    this.taskDefaultsCard = page.locator('section:has-text("Task defaults")');
    this.allowedListsBadge = page.locator('span[hlmbadge]:has-text("lists")');
    this.dailyTaskLimitBadge = page.locator('span[hlmbadge]:has-text("tasks")');
  }

  async gotoSettings(): Promise<void> {
    if (!this.page.url().includes('/settings')) {
      if (await this.profileMenuButton.isVisible()) {
        await this.openProfileMenu();
        await this.page.locator('a[routerLink="/settings"], a:has-text("Settings")').click();
      } else {
        await this.goto('/settings');
      }
    }
    await this.page.waitForURL(/\/settings/);
    await this.heading.waitFor({ state: 'visible' });
  }

  async selectTheme(theme: 'light' | 'dark'): Promise<void> {
    if (theme === 'light') {
      await this.lightThemeButton.click();
    } else {
      await this.darkThemeButton.click();
    }
  }

  async toggleNotifications(): Promise<void> {
    await this.notificationsButton.click();
  }
}
