import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { SidebarComponent } from './sidebar.component';

export class TodosPage extends BasePage {
  readonly sidebar: SidebarComponent;
  readonly createTaskInput: Locator;
  readonly addTaskButton: Locator;
  readonly quotaBadge: Locator;
  readonly activeSection: Locator;
  readonly activeRows: Locator;
  readonly completedSection: Locator;
  readonly completedToggle: Locator;
  readonly completedBadge: Locator;
  readonly completedRows: Locator;
  readonly searchInput: Locator;
  readonly toggleSearchButton: Locator;
  readonly clearSearchButton: Locator;
  readonly searchSpinner: Locator;

  constructor(page: Page) {
    super(page);
    this.sidebar = new SidebarComponent(page);
    this.createTaskInput = page.locator('input[aria-label="New task input"]');
    this.addTaskButton = page.locator('app-todo-create-bar button:has-text("Add task")');
    this.quotaBadge = page.locator('app-todo-create-bar span[hlmbadge]');
    this.activeSection = page.locator('section:has([cdkdroplist])');
    this.activeRows = page.locator('section [cdkdroplist] app-todo-item-row');
    this.completedSection = page.locator('app-completed-section');
    this.completedToggle = page.locator('button[aria-label="Toggle completed tasks history"]');
    this.completedBadge = page.locator('app-completed-section span[hlmbadge]');
    this.completedRows = page.locator('app-completed-section app-todo-item-row');
    this.searchInput = page.locator('input[placeholder="Filter tasks (press / to focus)"]');
    this.toggleSearchButton = page.locator('button[aria-label*="Search tasks"], button[aria-label*="Close search"]');
    this.clearSearchButton = page.locator('button[aria-label="Clear filter"]');
    this.searchSpinner = page.locator('svg.animate-spin');
  }

  async gotoWorkspace(): Promise<void> {
    await this.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  getActiveRow(text: string): Locator {
    return this.activeRows
      .filter({
        has: this.page.locator(`[aria-label*="${text}"]`),
      })
      .first();
  }

  getCompletedRow(text: string): Locator {
    return this.completedRows
      .filter({
        has: this.page.locator(`[aria-label*="${text}"]`),
      })
      .first();
  }

  async createTodo(text: string): Promise<void> {
    await this.createTaskInput.fill(text);
    await this.addTaskButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getActiveTodoTexts(): Promise<string[]> {
    const textButtons = this.activeRows.locator('button[aria-label^="Click or double click to edit task"]');
    return textButtons.allInnerTexts();
  }

  async getCompletedTodoTexts(): Promise<string[]> {
    const textButtons = this.completedRows.locator('button[aria-label^="Click or double click to edit task"]');
    return textButtons.allInnerTexts();
  }

  async toggleActiveTodo(text: string): Promise<void> {
    const row = this.getActiveRow(text);
    await row.locator('button[aria-label^="Mark as complete"]').click();
    await this.page.waitForLoadState('networkidle');
  }

  async toggleCompletedTodo(text: string): Promise<void> {
    const row = this.getCompletedRow(text);
    await row.locator('button[aria-label^="Mark as incomplete"]').click();
    await this.page.waitForLoadState('networkidle');
  }

  async renameTodo(oldText: string, newText: string): Promise<void> {
    const row = this.getActiveRow(oldText);
    const textButton = row.locator('button[aria-label^="Click or double click to edit task"]');
    await textButton.click();
    const editInput = row.locator('input[aria-label^="Edit task text"]');
    await editInput.waitFor({ state: 'visible' });
    await editInput.fill(newText);
    await editInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async deleteActiveTodo(text: string): Promise<void> {
    const row = this.getActiveRow(text);
    await row.hover();
    const deleteBtn = row.locator('button[aria-label^="Delete task"]');
    const deleteResponsePromise = this.page
      .waitForResponse(
        (resp) => resp.url().includes('/todos/') && resp.request().method() === 'DELETE',
        { timeout: 8000 },
      )
      .catch(() => null);
    await deleteBtn.click();
    await deleteResponsePromise;
    await this.page.waitForLoadState('networkidle');
  }

  async toggleCompletedSection(): Promise<void> {
    await this.completedToggle.click();
    await this.page.waitForLoadState('networkidle');
  }

  async search(query: string): Promise<void> {
    if (!(await this.searchInput.isVisible())) {
      if (await this.toggleSearchButton.isVisible()) {
        await this.toggleSearchButton.click();
      } else {
        await this.page.keyboard.press('/');
      }
      await this.searchInput.waitFor({ state: 'visible' });
    }
    await this.searchInput.fill(query);
    // Allow debounce and network request to finish
    await this.page.waitForTimeout(450);
    await this.page.waitForLoadState('networkidle');
  }

  async clearSearch(): Promise<void> {
    if (await this.clearSearchButton.isVisible()) {
      await this.clearSearchButton.click();
    } else {
      await this.searchInput.press('Escape');
    }
    await this.page.waitForTimeout(450);
    await this.page.waitForLoadState('networkidle');
  }

  async dragActiveTodo(sourceText: string, targetText: string): Promise<void> {
    const sourceRow = this.getActiveRow(sourceText);
    const targetRow = this.getActiveRow(targetText);
    const dragHandle = sourceRow.locator('[cdkdraghandle], div[aria-label="Drag to reorder task"]').first();

    const handleBox = await dragHandle.boundingBox();
    const targetBox = await targetRow.boundingBox();

    if (!handleBox || !targetBox) {
      throw new Error(`Unable to calculate bounding boxes for drag: "${sourceText}" -> "${targetText}"`);
    }

    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;
    const isMovingDown = targetBox.y > handleBox.y;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    // Exceed CDK pointer drag threshold (5px)
    const activateY = isMovingDown ? startY + 15 : startY - 15;
    await this.page.mouse.move(startX, activateY, { steps: 10 });
    await this.page.waitForTimeout(100);

    // Target slightly beyond midpoint in movement direction
    const targetY = isMovingDown
      ? targetBox.y + targetBox.height / 2 + 15
      : targetBox.y + targetBox.height / 2 - 15;
    await this.page.mouse.move(targetBox.x + targetBox.width / 2, targetY, { steps: 20 });
    await this.page.waitForTimeout(150);
    await this.page.mouse.up();
    // Wait for CDK drag preview animation to complete and detach
    await this.page.locator('.cdk-drag-preview').waitFor({ state: 'detached' }).catch(() => {});
    await this.page.waitForTimeout(300);
    await this.page.waitForLoadState('networkidle');
  }
}
