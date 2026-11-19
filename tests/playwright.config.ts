import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load E2E specific configuration from tests/.env.e2e
const e2eEnvPath = path.resolve(__dirname, '.env.e2e');
const e2eEnv: Record<string, string> = {};
if (fs.existsSync(e2eEnvPath)) {
  const content = fs.readFileSync(e2eEnvPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      e2eEnv[key] = val;
    }
  }
}

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
    baseURL: e2eEnv['FRONTEND_URL'] || 'http://localhost:4200',
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
      reuseExistingServer: false,
      timeout: 120 * 1000,
      cwd: path.resolve(__dirname, '..'),
      env: {
        ...(process.env as Record<string, string>),
        ...e2eEnv,
      },
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
