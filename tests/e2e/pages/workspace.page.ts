import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { SidebarComponent } from './sidebar.component';

export class WorkspacePage extends BasePage {
  readonly sidebar: SidebarComponent;
  readonly listHeaderTitleButton: Locator;
  readonly listTitleEditInput: Locator;
  readonly deleteListButton: Locator;
  readonly alertDialogContent: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;
  readonly activeCountChip: Locator;
  readonly progressPercentage: Locator;

  constructor(page: Page) {
    super(page);
    this.sidebar = new SidebarComponent(page);
    this.listHeaderTitleButton = page.locator('app-list-header h1 button');
    this.listTitleEditInput = page.locator('input#edit-list-title-input');
    this.deleteListButton = page.locator('button[aria-label="Delete this list"], button[aria-label="Delete list"]');
    this.alertDialogContent = page.locator('hlm-alert-dialog-content');
    this.confirmDeleteButton = page.locator('button:has-text("Delete List")');
    this.cancelDeleteButton = page.locator('button:has-text("Cancel")');
    this.activeCountChip = page.locator('app-list-header span[hlmbadge]');
    this.progressPercentage = page.locator('span:has-text("%")');
  }

  async gotoWorkspace(): Promise<void> {
    await this.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async startEditingTitle(): Promise<void> {
    await this.listHeaderTitleButton.click();
    await this.listTitleEditInput.waitFor({ state: 'visible' });
  }

  async renameList(newTitle: string): Promise<void> {
    await this.startEditingTitle();
    await this.listTitleEditInput.fill(newTitle);
    await this.listTitleEditInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async deleteCurrentList(): Promise<void> {
    await this.deleteListButton.click();
    await this.confirmDeleteButton.waitFor({ state: 'visible' });
    await this.confirmDeleteButton.click();
    await this.alertDialogContent.waitFor({ state: 'detached' });
    await this.page.waitForLoadState('networkidle');
  }
}
