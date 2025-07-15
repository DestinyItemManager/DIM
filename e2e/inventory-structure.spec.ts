import { expect, test } from '@playwright/test';
import { InventoryHelpers } from './helpers/inventory-helpers';

test.describe('Inventory Page - Core Structure', () => {
  let helpers: InventoryHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new InventoryHelpers(page);
    await helpers.navigateToInventory();
  });

  test('displays header with navigation elements', async ({ page }) => {
    await helpers.verifyHeader();

    // Additional header checks - should have navigation links
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('link').first()).toBeVisible(); // Some navigation link
  });

  test('displays all three character sections', async ({ page }) => {
    await helpers.verifyAllCharacters();
  });

  test('displays character stats for active character', async ({ page }) => {
    await helpers.verifyCharacterStats();

    // Verify that stat values are displayed as groups with numeric values
    const statNames = ['Mobility', 'Resilience', 'Recovery', 'Discipline', 'Intellect', 'Strength'];
    for (const statName of statNames) {
      // Each stat should be displayed as a group with the stat name and a numeric value
      const statGroup = page.getByRole('group', { name: new RegExp(`${statName}.*\d+`, 'i') });
      await expect(statGroup).toBeVisible();
    }
  });

  test('displays vault section with storage information', async ({ page }) => {
    await helpers.verifyVaultSection();
  });

  test('displays postmaster sections', async ({ page }) => {
    await helpers.verifyPostmaster();
  });

  test('displays main inventory sections', async ({ page }) => {
    await helpers.verifyInventorySections();
  });

  test('displays weapons section with item categories', async ({ page }) => {
    await helpers.verifyWeaponsSection();
  });

  test('displays armor section with equipment slots', async ({ page }) => {
    await helpers.verifyArmorSection();
  });

  test('displays item feed button', async ({ page }) => {
    // Verify item feed toggle is present
    const itemFeedButton = page.getByRole('button', { name: /item feed/i });
    await expect(itemFeedButton).toBeVisible();
  });

  test('has correct page title', async ({ page }) => {
    // Verify page title is set correctly
    await expect(page).toHaveTitle(/DIM.*Inventory/);
  });

  test('loads without critical errors', async ({ page }) => {
    await helpers.verifyNoCriticalErrors();

    // Verify main content is loaded
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByText('Loading')).not.toBeVisible();
  });
});
