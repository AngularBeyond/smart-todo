import { Locator, Page } from '@playwright/test';

export class SidebarComponent {
  readonly aside: Locator;
  readonly allTasksButton: Locator;
  readonly starredTasksButton: Locator;
  readonly newListInput: Locator;
  readonly createListButton: Locator;
  readonly quotaIndicator: Locator;
  readonly unstarredDropList: Locator;
  readonly aboutButton: Locator;

  constructor(protected readonly page: Page) {
    this.aside = page.locator('aside.bg-sidebar:visible');
    this.allTasksButton = this.aside.locator('button:has-text("All tasks")');
    this.starredTasksButton = this.aside.locator('nav button:has-text("Starred")');
    this.newListInput = this.aside.locator('input#new-list-input');
    this.createListButton = this.aside.locator('button[aria-label="Create list"]');
    this.quotaIndicator = this.aside.locator('label[for="new-list-input"] + span');
    this.unstarredDropList = this.aside.locator('[cdkdroplist]');
    this.aboutButton = this.aside.locator('button:has-text("About")');
  }

  getUnstarredItem(name: string): Locator {
    return this.aside.locator('[cdkdrag]').filter({ hasText: name }).first();
  }

  getStarredItem(name: string): Locator {
    return this.aside
      .locator('div.mt-2:not([cdkdroplist]) button')
      .filter({ hasText: name })
      .first();
  }

  async selectList(name: string): Promise<void> {
    const listBtn = this.aside.locator(`button:has-text("${name}")`).first();
    await listBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async createList(name: string): Promise<void> {
    await this.newListInput.fill(name);
    await this.createListButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async toggleStar(name: string): Promise<void> {
    // Check if in unstarred section
    const unstarred = this.getUnstarredItem(name);
    if (await unstarred.isVisible()) {
      await unstarred.locator('button[aria-label="Star list"]').click();
      await this.page.waitForLoadState('networkidle');
      return;
    }

    // Check if in starred section
    const starred = this.getStarredItem(name);
    if (await starred.isVisible()) {
      await starred.locator('button[aria-label="Unstar list"]').click();
      await this.page.waitForLoadState('networkidle');
      return;
    }

    throw new Error(`List "${name}" was not found in sidebar to toggle star.`);
  }

  async getUnstarredListNames(): Promise<string[]> {
    const items = this.aside.locator('[cdkdrag] span.truncate');
    return items.allInnerTexts();
  }

  async getStarredListNames(): Promise<string[]> {
    const items = this.aside.locator('div.mt-2:not([cdkdroplist]) button span.truncate');
    return items.allInnerTexts();
  }

  async getQuotaText(): Promise<string> {
    return (await this.quotaIndicator.innerText()).trim();
  }

  async isAddListDisabled(): Promise<boolean> {
    return await this.newListInput.isDisabled();
  }

  async gotoAbout(): Promise<void> {
    await this.aboutButton.click();
    await this.page.waitForURL(/\/about/);
    await this.page.waitForLoadState('networkidle');
  }
}
