import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { TodosPage } from '../../pages/todos.page';
import { generateUser } from '../../fixtures/test-data';

test.describe('Todo Items Search Filter & Highlighting E2E', () => {
  test('filters active tasks with debouncing, highlights query with <mark>, and suppresses drag handles', async ({ page }) => {
    const authPage = new AuthPage(page);
    const todosPage = new TodosPage(page);
    const user = generateUser('todo_filter_active');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Initial state: 4 active tasks, drag handle is visible
    await expect(todosPage.activeRows).toHaveCount(4);
    const firstRowDragHandle = todosPage.activeRows.first().locator('div[aria-label="Drag to reorder task"]');
    await expect(firstRowDragHandle).toBeVisible();

    // Type query "inline" into filter input
    await todosPage.search('inline');

    // Filtered results: only 1 active task matches
    await expect(todosPage.activeRows).toHaveCount(1);
    const matchedRow = todosPage.getActiveRow('inline');
    await expect(matchedRow).toBeVisible();

    // Verify <mark> element highlights the matching term
    const markElement = matchedRow.locator('mark');
    await expect(markElement).toBeVisible();
    await expect(markElement).toHaveText('inline');

    // Verify drag handles are suppressed during search
    await expect(matchedRow.locator('div[aria-label="Drag to reorder task"]')).toBeHidden();

    // Clear search filter using 'X' button
    await todosPage.clearSearch();

    // All active tasks and drag handles are restored
    await expect(todosPage.activeRows).toHaveCount(4);
    await expect(firstRowDragHandle).toBeVisible();
  });

  test('auto-expands completed accordion during search and restores collapsed state on clear', async ({ page }) => {
    const authPage = new AuthPage(page);
    const todosPage = new TodosPage(page);
    const user = generateUser('todo_filter_acc');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Initially collapsed
    await expect(todosPage.completedToggle).toHaveAttribute('aria-expanded', 'false');

    // Search for term in completed task ("account" in "Create your Smart TODO account.")
    await todosPage.search('account');

    // Completed accordion should auto-expand
    await expect(todosPage.completedToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(todosPage.completedRows).toHaveCount(1);

    const completedRow = todosPage.getCompletedRow('Create your Smart TODO account.');
    await expect(completedRow).toBeVisible();
    const markElement = completedRow.locator('mark');
    await expect(markElement).toBeVisible();
    await expect(markElement).toHaveText('account');

    // Clear search using Escape key
    await todosPage.searchInput.press('Escape');
    await page.waitForTimeout(450);
    await page.waitForLoadState('networkidle');

    // Accordion restores previous collapsed state
    await expect(todosPage.completedToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(todosPage.completedRows).toHaveCount(0);
  });

  test('focuses filter input via global "/" shortcut', async ({ page }) => {
    const authPage = new AuthPage(page);
    const todosPage = new TodosPage(page);
    const user = generateUser('todo_filter_shortcut');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Ensure filter input is not focused initially
    await expect(todosPage.searchInput).not.toBeFocused();

    // Press '/' key
    await page.keyboard.press('/');

    // Verify search input is focused
    await expect(todosPage.searchInput).toBeFocused();
  });
});
