import { Locator, Page } from '@playwright/test';

export class BasePage {
  readonly profileMenuButton: Locator;
  readonly logoutButton: Locator;
  readonly themeToggleButton: Locator;

  constructor(protected readonly page: Page) {
    this.profileMenuButton = page.locator('button[aria-label="Open profile menu"]');
    this.logoutButton = page.locator('button:has-text("Logout"), button:has-text("Log out")');
    this.themeToggleButton = page.locator('button[aria-label="Toggle theme"]');
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForUrl(urlOrPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlOrPattern);
  }

  async openProfileMenu(): Promise<void> {
    if (await this.logoutButton.isVisible()) {
      return;
    }
    // Hovering opens the menu via (mouseenter)
    await this.profileMenuButton.hover();
    try {
      await this.logoutButton.waitFor({ state: 'visible', timeout: 2000 });
    } catch {
      // Fallback: click if hover alone didn't open
      await this.profileMenuButton.click();
      await this.logoutButton.waitFor({ state: 'visible', timeout: 5000 });
    }
  }

  async logout(): Promise<void> {
    await this.openProfileMenu();
    await this.logoutButton.click();
    await this.page.waitForURL(/\/login/);
  }
}

