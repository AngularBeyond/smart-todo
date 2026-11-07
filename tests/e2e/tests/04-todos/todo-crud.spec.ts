import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { TodosPage } from '../../pages/todos.page';
import { generateUser } from '../../fixtures/test-data';

test.describe('Todo Items CRUD & Top-Insertion E2E', () => {
  test('creates new task and inserts at index 0 (top of list), updating counters and database', async ({ page }) => {
    const authPage = new AuthPage(page);
    const todosPage = new TodosPage(page);
    const user = generateUser('todo_create');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Initial state: default seeded tasks in "My Tasks" (4 active, 1 completed = 5/40 total quota)
    await expect(todosPage.activeRows).toHaveCount(4);
    await expect(todosPage.quotaBadge).toContainText('5/40');

    // Create a new task
    const newTaskText = 'Buy organic groceries and fruits';
    await todosPage.createTodo(newTaskText);

    // Verify task is inserted at index 0 (top of the list)
    await expect(todosPage.activeRows).toHaveCount(5);
    const firstRowText = await todosPage.activeRows.first().locator('button[aria-label^="Click or double click to edit task"]').innerText();
    expect(firstRowText).toBe(newTaskText);
    await expect(todosPage.quotaBadge).toContainText('6/40');

    // Reload page to verify backend database persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(todosPage.activeRows).toHaveCount(5);
    const reloadedFirstRowText = await todosPage.activeRows.first().locator('button[aria-label^="Click or double click to edit task"]').innerText();
    expect(reloadedFirstRowText).toBe(newTaskText);
    await expect(todosPage.quotaBadge).toContainText('6/40');
  });

  test('edits task text inline on single-click with auto-focus and saves with Enter or cancels with Escape', async ({ page }) => {
    const authPage = new AuthPage(page);
    const todosPage = new TodosPage(page);
    const user = generateUser('todo_edit');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Create a task to edit
    const initialText = 'Prepare quarterly presentation slides';
    await todosPage.createTodo(initialText);
    await expect(todosPage.getActiveRow(initialText)).toBeVisible();

    // 1. Test Escape cancellation
    const row = todosPage.getActiveRow(initialText);
    await row.locator('button[aria-label^="Click or double click to edit task"]').click();
    const editInput = row.locator('input[aria-label^="Edit task text"]');
    await expect(editInput).toBeVisible();
    await expect(editInput).toBeFocused();
    await editInput.fill('Discarded Slide Content');
    await editInput.press('Escape');
    await expect(editInput).toBeHidden();
    await expect(todosPage.getActiveRow(initialText)).toBeVisible();

    // 2. Test Enter saving
    const updatedText = 'Prepare final executive presentation slides';
    await todosPage.renameTodo(initialText, updatedText);

    // Verify updated text in UI
    await expect(todosPage.getActiveRow(updatedText)).toBeVisible();
    await expect(todosPage.getActiveRow(initialText)).toBeHidden();

    // Reload page to verify database persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(todosPage.getActiveRow(updatedText)).toBeVisible();
  });

  test('deletes a task on trash icon click, updating counters and persisting deletion', async ({ page }) => {
    const authPage = new AuthPage(page);
    const todosPage = new TodosPage(page);
    const user = generateUser('todo_delete');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Create task to delete
    const taskToDelete = 'Temporary scratch task to remove';
    await todosPage.createTodo(taskToDelete);
    await expect(todosPage.getActiveRow(taskToDelete)).toBeVisible();
    await expect(todosPage.activeRows).toHaveCount(5);
    await expect(todosPage.quotaBadge).toContainText('6/40');

    // Delete task
    await todosPage.deleteActiveTodo(taskToDelete);

    // Verify removed from DOM
    await expect(todosPage.getActiveRow(taskToDelete)).toBeHidden();
    await expect(todosPage.activeRows).toHaveCount(4);
    await expect(todosPage.quotaBadge).toContainText('5/40');

    // Reload page to verify database persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(todosPage.getActiveRow(taskToDelete)).toBeHidden();
    await expect(todosPage.activeRows).toHaveCount(4);
    await expect(todosPage.quotaBadge).toContainText('5/40');
  });
});
