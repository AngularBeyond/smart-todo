import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

/**
 * Playwright E2E configuration for Smart TODO Application
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run auth and state-dependent tests sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Deterministic single-worker execution for local database tests
  outputDir: './test-results',
  reporter: [['html', { outputFolder: './playwright-report', open: 'never' }], ['list']],
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
      cwd: path.resolve(__dirname, '..'),
    },
    {
      command: 'pnpm --prefix smart-todo start',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 120 * 1000,
      cwd: path.resolve(__dirname, '..'),
    },
  ],
});
