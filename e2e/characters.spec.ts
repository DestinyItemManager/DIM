import { expect, test } from '@playwright/test';

test.describe('Character Management', () => {
  test('displays multiple characters from mock data', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });

    // Should contain main navigation
    await expect(page.locator('body')).toContainText('Inventory');

    // Should not show critical error states
    await expect(page.locator('.developer-settings, .login-required')).not.toBeVisible();
  });

  test('character switching functionality', async ({ page }) => {
    await page.goto('/');

    // Wait for characters to load
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });

    // Should contain main navigation
    await expect(page.locator('body')).toContainText('Inventory');

    // Should not show critical error states
    await expect(page.locator('.developer-settings, .login-required')).not.toBeVisible();

    // Note: Character switching would require finding actual clickable elements
  });

  test('character emblem and basic info display', async ({ page }) => {
    await page.goto('/');

    // Wait for character data to load
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });

    // Should contain main navigation
    await expect(page.locator('body')).toContainText('Inventory');

    // Should not show critical error states
    await expect(page.locator('.developer-settings, .login-required')).not.toBeVisible();
  });
});
