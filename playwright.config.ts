import { defineConfig, devices } from '@playwright/test';

// See https://playwright.dev/docs/test-configuration.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://localhost:8081',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
    // Increase timeouts temporarily to debug
    actionTimeout: 15000,
    navigationTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm run test:e2e:server',
    url: 'https://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 180000, // 3 minutes for webpack build
    ignoreHTTPSErrors: true,
    stderr: 'pipe',
    stdout: 'pipe',
  },
});
