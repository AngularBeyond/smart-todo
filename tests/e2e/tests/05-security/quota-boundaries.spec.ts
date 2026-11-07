import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { TodosPage } from '../../pages/todos.page';
import { generateUser } from '../../fixtures/test-data';

test.describe('40-Todo Hard Quota Boundary E2E', () => {
  test('enforces 40-todo per list quota with UI creation lock, blocks 41st task with 422, and unlocks on deletion', async ({ page }) => {
    const authPage = new AuthPage(page);
    const todosPage = new TodosPage(page);
    const user = generateUser('quota_40_todo');

    // 1. Register new user and capture accessToken
    await authPage.gotoRegister();
    const registerPromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/auth/register') && res.request().method() === 'POST'
    );
    await authPage.register(user);
    const registerRes = await registerPromise;
    const registerJson = await registerRes.json();
    const token = registerJson.data.accessToken;
    expect(token).toBeDefined();

    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Initial state: seeded with 5 tasks (4 active, 1 completed)
    await expect(todosPage.quotaBadge).toHaveText('5/40');
    await expect(todosPage.createTaskInput).toBeEnabled();

    // 2. Fetch default list ID
    const listsRes = await page.request.get('http://localhost:3000/api/v1/lists', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listsJson = await listsRes.json();
    const defaultList = listsJson.data.lists[0];
    const listId = defaultList.id;

    // 3. Batch-create 35 tasks via API to reach exactly 40 tasks (5 initial + 35 = 40)
    const authHeader = { Authorization: `Bearer ${token}` };
    const createPromises = [];
    for (let i = 1; i <= 35; i++) {
      createPromises.push(
        page.request.post(`http://localhost:3000/api/v1/lists/${listId}/todos`, {
          headers: authHeader,
          data: { text: `Bulk Quota Item #${i}` },
        })
      );
    }
    const createResponses = await Promise.all(createPromises);
    for (const res of createResponses) {
      expect(res.status()).toBe(201);
    }

    // 4. Reload UI to reflect 40/40 limit reached
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 4a. Verify quota badge
    await expect(todosPage.quotaBadge).toHaveText('40/40');

    // 4b. Verify input is disabled with quota reached placeholder
    await expect(todosPage.createTaskInput).toBeDisabled();
    await expect(todosPage.createTaskInput).toHaveAttribute('placeholder', 'List quota reached (40/40)');

    // 4c. Verify Add task button is disabled
    await expect(todosPage.addTaskButton).toBeDisabled();

    // 5. Test backend boundary enforcement: 41st task attempt receives 422 Unprocessable Entity
    const overflowRes = await page.request.post(`http://localhost:3000/api/v1/lists/${listId}/todos`, {
      headers: authHeader,
      data: { text: 'Forbidden 41st Task' },
    });
    expect(overflowRes.status()).toBe(422);
    const overflowJson = await overflowRes.json();
    expect(overflowJson.success).toBe(false);
    expect(overflowJson.errorCode).toBe('TODO_QUOTA_EXCEEDED');

    // 6. Test quota relief: delete 1 active task
    const activeTexts = await todosPage.getActiveTodoTexts();
    const taskToDelete = activeTexts[0];
    await todosPage.deleteActiveTodo(taskToDelete);

    // 6a. Quota badge drops to 39/40
    await expect(todosPage.quotaBadge).toHaveText('39/40');

    // 6b. Input and button are re-enabled
    await expect(todosPage.createTaskInput).toBeEnabled();
    await expect(todosPage.createTaskInput).toHaveAttribute('placeholder', 'What needs your attention?');

    // 6c. User successfully adds the 40th task again via UI
    await todosPage.createTodo('Allowed Final Task 40');

    // 6d. Quota returns to 40/40 and locks again
    await expect(todosPage.quotaBadge).toHaveText('40/40');
    await expect(todosPage.createTaskInput).toBeDisabled();
    await expect(todosPage.addTaskButton).toBeDisabled();
  });
});
