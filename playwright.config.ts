import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for Smart TODO Application
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run auth and state-dependent tests sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Deterministic single-worker execution for local database tests
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --prefix smart-todo-api start',
      url: 'http://localhost:3000/api/v1/health',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: 'pnpm --prefix smart-todo start',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
  ],
});
