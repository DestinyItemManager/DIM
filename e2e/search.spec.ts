import { expect, test } from '@playwright/test';

test.describe('App Navigation', () => {
  test('app loads successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for the app to load successfully - be more flexible about timing
    await page.waitForTimeout(5000);

    // Wait for the app to load
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });

    // Should contain main navigation
    await expect(page.locator('body')).toContainText('Inventory');

    // Should not show critical error states
    await expect(page.locator('.developer-settings, .login-required')).not.toBeVisible();
  });

  test('navigation contains expected text', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load - header might be dynamically created
    await page.waitForTimeout(5000);

    // Should contain main navigation elements in the page
    await expect(page.locator('body')).toContainText('Inventory');
    await expect(page.locator('body')).toContainText('Progress');
    await expect(page.locator('body')).toContainText('Vendors');

    // Should not show critical error states
    await expect(page.locator('.developer-settings, .login-required')).not.toBeVisible();
  });

  test('header contains navigation elements', async ({ page }) => {
    await page.goto('/');

    // Wait for the app to load
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });

    // Header should contain navigation elements (we saw "InventoryProgressVendorsRecordsLoadoutsOrganizer")
    await expect(page.locator('header')).toContainText('Inventory');
    await expect(page.locator('header')).toContainText('Progress');

    // Should contain main navigation in body
    await expect(page.locator('body')).toContainText('Inventory');

    // Should not show critical error states
    await expect(page.locator('.developer-settings, .login-required')).not.toBeVisible();
  });

  test('page title is correct', async ({ page }) => {
    await page.goto('/');

    // Wait for the app to load
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });

    // App should have correct title
    await expect(page).toHaveTitle(/^DIM/);

    // Should contain main navigation
    await expect(page.locator('body')).toContainText('Inventory');

    // Should not show critical error states
    await expect(page.locator('.developer-settings, .login-required')).not.toBeVisible();
  });
});
