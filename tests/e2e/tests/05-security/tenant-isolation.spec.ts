import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { WorkspacePage } from '../../pages/workspace.page';
import { TodosPage } from '../../pages/todos.page';
import { generateUser } from '../../fixtures/test-data';

test.describe('Multi-User Tenant Isolation & IDOR Protection E2E', () => {
  test('strictly isolates lists and tasks between concurrent browser contexts and blocks IDOR tampering', async ({ browser }) => {
    // 1. Initialize two isolated, concurrent browser contexts
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    const authPageA = new AuthPage(pageA);
    const workspacePageA = new WorkspacePage(pageA);
    const todosPageA = new TodosPage(pageA);

    const authPageB = new AuthPage(pageB);
    const workspacePageB = new WorkspacePage(pageB);
    const todosPageB = new TodosPage(pageB);

    const userA = generateUser('tenant_a');
    const userB = generateUser('tenant_b');

    try {
      // 2. User A registers and provisions private workspace data
      await authPageA.gotoRegister();
      await authPageA.register(userA);
      await expect(pageA).toHaveURL(/\/(\?.*)?$/);

      const privateListName = 'User A Confidential Vault';
      const secretTaskText = 'Top Secret User A Security Blueprint';

      const createListPromise = pageA.waitForResponse(
        (res) => res.url().includes('/api/v1/lists') && res.request().method() === 'POST'
      );
      await workspacePageA.sidebar.createList(privateListName);
      const createListRes = await createListPromise;
      const createListJson = await createListRes.json();
      const userAListId = createListJson.data?.list?.id || createListJson.data?.id;
      expect(userAListId).toBeDefined();

      await expect(workspacePageA.sidebar.getUnstarredItem(privateListName)).toBeVisible();
      await workspacePageA.sidebar.selectList(privateListName);

      await todosPageA.createTodo(secretTaskText);
      await expect(todosPageA.getActiveRow(secretTaskText)).toBeVisible();

      // 3. User B registers in independent concurrent browser context
      await authPageB.gotoRegister();
      const registerPromiseB = pageB.waitForResponse(
        (res) => res.url().includes('/api/v1/auth/register') && res.request().method() === 'POST'
      );
      await authPageB.register(userB);
      const registerResB = await registerPromiseB;
      const registerJsonB = await registerResB.json();
      const userBToken = registerJsonB.data.accessToken;
      expect(userBToken).toBeDefined();

      await expect(pageB).toHaveURL(/\/(\?.*)?$/);

      // Verify User B's sidebar only shows User B's default workspace
      await expect(workspacePageB.sidebar.getUnstarredItem('My Tasks')).toBeVisible();
      await expect(workspacePageB.sidebar.getUnstarredItem(privateListName)).toBeHidden();

      // Verify User B cannot see User A's secret task
      await expect(todosPageB.getActiveRow(secretTaskText)).toBeHidden();

      // 4. User B attempts unauthorized UI direct navigation to User A's list
      await pageB.goto(`/?listId=${userAListId}`);
      await pageB.waitForLoadState('networkidle');

      // User B should NOT see User A's private list name in header or sidebar
      await expect(workspacePageB.sidebar.getUnstarredItem(privateListName)).toBeHidden();
      await expect(todosPageB.getActiveRow(secretTaskText)).toBeHidden();

      // 5. User B attempts IDOR API attacks using User B's authenticated request context
      const authHeaderB = { Authorization: `Bearer ${userBToken}` };

      // 5a. Read User A's tasks
      const unauthorizedGetRes = await pageB.request.get(`http://localhost:3000/api/v1/lists/${userAListId}/todos`, {
        headers: authHeaderB,
      });
      expect(unauthorizedGetRes.status()).toBe(404);
      const getJson = await unauthorizedGetRes.json();
      expect(getJson.success).toBe(false);

      // 5b. Create task in User A's list
      const unauthorizedPostRes = await pageB.request.post(`http://localhost:3000/api/v1/lists/${userAListId}/todos`, {
        headers: authHeaderB,
        data: { text: 'Malicious injection by User B' },
      });
      expect(unauthorizedPostRes.status()).toBe(404);
      const postJson = await unauthorizedPostRes.json();
      expect(postJson.success).toBe(false);

      // 5c. Rename User A's list
      const unauthorizedPatchRes = await pageB.request.patch(`http://localhost:3000/api/v1/lists/${userAListId}`, {
        headers: authHeaderB,
        data: { name: 'Compromised by User B' },
      });
      expect(unauthorizedPatchRes.status()).toBe(404);
      const patchJson = await unauthorizedPatchRes.json();
      expect(patchJson.success).toBe(false);

      // 5d. Delete User A's list
      const unauthorizedDeleteRes = await pageB.request.delete(`http://localhost:3000/api/v1/lists/${userAListId}`, {
        headers: authHeaderB,
      });
      expect(unauthorizedDeleteRes.status()).toBe(404);
      const deleteJson = await unauthorizedDeleteRes.json();
      expect(deleteJson.success).toBe(false);

      // 6. Verify User A's data remains completely intact and unaffected
      await pageA.reload();
      await pageA.waitForLoadState('networkidle');
      await expect(workspacePageA.sidebar.getUnstarredItem(privateListName)).toBeVisible();
      await workspacePageA.sidebar.selectList(privateListName);
      await expect(todosPageA.getActiveRow(secretTaskText)).toBeVisible();
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
