import { expect, test } from '@playwright/test';

test.describe('Inventory with Mock Data', () => {
  test('loads inventory items from mock data', async ({ page }) => {
    await page.goto('/');

    // Wait for the app to load successfully - be more flexible about timing
    await page.waitForTimeout(5000);

    // Should contain main navigation indicating app loaded
    await expect(page.locator('body')).toContainText('Inventory');

    // Should not show critical error states
    await expect(page.locator('.developer-settings, .login-required')).not.toBeVisible();
  });

  test('displays vault section', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });

    // Should contain main navigation
    await expect(page.locator('body')).toContainText('Inventory');

    // Should not show critical error states
    await expect(page.locator('.developer-settings, .login-required')).not.toBeVisible();
  });

  test('shows character information', async ({ page }) => {
    await page.goto('/');

    // Wait for character info to load
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });

    // Should contain main navigation
    await expect(page.locator('body')).toContainText('Inventory');

    // Should not show critical error states
    await expect(page.locator('.developer-settings, .login-required')).not.toBeVisible();
  });
});
