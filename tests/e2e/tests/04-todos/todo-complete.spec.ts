import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { TodosPage } from '../../pages/todos.page';
import { generateUser } from '../../fixtures/test-data';

test.describe('Todo Items Completion & Uncomplete-to-Top Rule E2E', () => {
  test('marks active task as complete, moves to completed history, and updates progress counters', async ({ page }) => {
    const authPage = new AuthPage(page);
    const todosPage = new TodosPage(page);
    const user = generateUser('todo_mark_comp');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Initial state: 4 active tasks, 1 completed task
    await expect(todosPage.activeRows).toHaveCount(4);
    await expect(todosPage.completedBadge).toHaveText('1');

    const taskToComplete = 'Welcome! Click or tap on any task text to edit it inline.';
    await expect(todosPage.getActiveRow(taskToComplete)).toBeVisible();

    // Mark task as complete
    await todosPage.toggleActiveTodo(taskToComplete);

    // Verify task is removed from active list
    await expect(todosPage.activeRows).toHaveCount(3);
    await expect(todosPage.getActiveRow(taskToComplete)).toBeHidden();
    await expect(todosPage.completedBadge).toHaveText('2');

    // Expand completed accordion and verify completed item styling
    await todosPage.toggleCompletedSection();
    await expect(todosPage.completedRows).toHaveCount(2);
    const completedRow = todosPage.getCompletedRow(taskToComplete);
    await expect(completedRow).toBeVisible();
    await expect(completedRow.locator('button[aria-label^="Click or double click to edit task"]')).toHaveClass(/line-through/);

    // Reload page to verify database persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(todosPage.activeRows).toHaveCount(3);
    await expect(todosPage.completedBadge).toHaveText('2');

    await todosPage.toggleCompletedSection();
    await expect(todosPage.getCompletedRow(taskToComplete)).toBeVisible();
  });

  test('uncompletes task from history, returning it to index 0 of active list (uncomplete-to-top rule)', async ({ page }) => {
    const authPage = new AuthPage(page);
    const todosPage = new TodosPage(page);
    const user = generateUser('todo_uncomplete');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Expand completed section (seeded with "Create your Smart TODO account.")
    await todosPage.toggleCompletedSection();
    const seededCompletedTask = 'Create your Smart TODO account.';
    await expect(todosPage.getCompletedRow(seededCompletedTask)).toBeVisible();

    // Uncomplete the task
    await todosPage.toggleCompletedTodo(seededCompletedTask);

    // Verify completed count drops to 0
    await expect(todosPage.completedBadge).toHaveText('0');
    await expect(todosPage.getCompletedRow(seededCompletedTask)).toBeHidden();

    // Verify it is placed at index 0 (top of the active list)
    await expect(todosPage.activeRows).toHaveCount(5);
    const firstActiveRowText = await todosPage.activeRows.first().locator('button[aria-label^="Click or double click to edit task"]').innerText();
    expect(firstActiveRowText).toBe(seededCompletedTask);

    // Reload page to verify uncomplete-to-top persistence in database
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(todosPage.activeRows).toHaveCount(5);
    const reloadedFirstRowText = await todosPage.activeRows.first().locator('button[aria-label^="Click or double click to edit task"]').innerText();
    expect(reloadedFirstRowText).toBe(seededCompletedTask);
  });

  test('toggles completed history accordion with view/hide state and lazy-loading', async ({ page }) => {
    const authPage = new AuthPage(page);
    const todosPage = new TodosPage(page);
    const user = generateUser('todo_accordion');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Initially collapsed
    await expect(todosPage.completedToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(todosPage.completedRows).toHaveCount(0);

    // Expand
    await todosPage.toggleCompletedSection();
    await expect(todosPage.completedToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(todosPage.completedRows).toHaveCount(1);

    // Collapse
    await todosPage.toggleCompletedSection();
    await expect(todosPage.completedToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(todosPage.completedRows).toHaveCount(0);
  });
});
