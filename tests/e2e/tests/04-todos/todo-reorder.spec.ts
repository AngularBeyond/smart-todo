import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { TodosPage } from '../../pages/todos.page';
import { generateUser } from '../../fixtures/test-data';

test.describe('Todo Items CDK Drag and Drop Reordering E2E', () => {
  test('reorders active tasks downward via drag handle and persists order across reload', async ({ page }) => {
    const authPage = new AuthPage(page);
    const todosPage = new TodosPage(page);
    const user = generateUser('todo_reorder_down');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    await expect(todosPage.activeRows).toHaveCount(4);

    const initialTexts = await todosPage.getActiveTodoTexts();
    const taskA = initialTexts[0];
    const taskB = initialTexts[1];

    // Drag first task (taskA) below the second task (taskB)
    await todosPage.dragActiveTodo(taskA, taskB);

    // Verify visual order change: taskB is now at index 0, taskA is at index 1
    const newTexts = await todosPage.getActiveTodoTexts();
    expect(newTexts[0]).toBe(taskB);
    expect(newTexts[1]).toBe(taskA);

    // Reload page to verify backend order persistence in database
    await page.reload();
    await page.waitForLoadState('networkidle');
    const reloadedTexts = await todosPage.getActiveTodoTexts();
    expect(reloadedTexts[0]).toBe(taskB);
    expect(reloadedTexts[1]).toBe(taskA);
  });

  test('reorders active tasks upward via drag handle and persists order across reload', async ({ page }) => {
    const authPage = new AuthPage(page);
    const todosPage = new TodosPage(page);
    const user = generateUser('todo_reorder_up');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    await expect(todosPage.activeRows).toHaveCount(4);

    const initialTexts = await todosPage.getActiveTodoTexts();
    const taskFirst = initialTexts[0];
    const taskThird = initialTexts[2];

    // Drag third task (taskThird) up above first task (taskFirst)
    await todosPage.dragActiveTodo(taskThird, taskFirst);

    // Verify visual order change: taskThird is now at index 0
    const newTexts = await todosPage.getActiveTodoTexts();
    expect(newTexts[0]).toBe(taskThird);

    // Reload page to verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    const reloadedTexts = await todosPage.getActiveTodoTexts();
    expect(reloadedTexts[0]).toBe(taskThird);
  });
});
