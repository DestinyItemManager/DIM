import { expect, test } from '@playwright/test';

test.describe('Basic App Loading', () => {
  test('loads DIM application successfully', async ({ page }) => {
    await page.goto('/');

    // App should have correct title (includes page name)
    await expect(page).toHaveTitle(/^DIM/);

    // App should load successfully with header visible
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });

    // Should contain main navigation text indicating app loaded
    await expect(page.locator('body')).toContainText('Inventory');

    // Should not show critical error states (but loading states are OK)
    await expect(page.locator('.developer-settings, .login-required')).not.toBeVisible();
  });

  test('main navigation is present', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });

    // Should contain the main navigation text (Inventory, Progress, etc.)
    await expect(page.locator('body')).toContainText('Inventory');
    await expect(page.locator('body')).toContainText('Progress');
    await expect(page.locator('body')).toContainText('Vendors');
  });
});
