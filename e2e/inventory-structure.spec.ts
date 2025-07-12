import { expect, test } from '@playwright/test';

test.describe('Inventory Page - Core Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to fully load
    await expect(page.locator('main[aria-label="Inventory"]')).toBeVisible({ timeout: 15000 });
  });

  test('displays header with navigation elements', async ({ page }) => {
    // Verify main navigation elements in header
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('img[alt="dim"]')).toBeVisible();

    // Search functionality
    await expect(page.getByRole('combobox', { name: /search/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();

    // Settings link
    await expect(page.getByRole('link').filter({ hasText: '' }).first()).toBeVisible();
  });

  test('displays all three character sections', async ({ page }) => {
    // Wait for character data to load
    await expect(page.getByText('Hunter')).toBeVisible();
    await expect(page.getByText('Warlock')).toBeVisible();
    await expect(page.getByText('Titan')).toBeVisible();

    // Verify each character has power level displayed
    const powerLevelPattern = /\d{4}/; // 4-digit power level
    const hunterSection = page.locator('button').filter({ hasText: 'Hunter' });
    const warlockSection = page.locator('button').filter({ hasText: 'Warlock' });
    const titanSection = page.locator('button').filter({ hasText: 'Titan' });

    await expect(hunterSection).toContainText(powerLevelPattern);
    await expect(warlockSection).toContainText(powerLevelPattern);
    await expect(titanSection).toContainText(powerLevelPattern);
  });

  test('displays character stats for active character', async ({ page }) => {
    // Verify stats are displayed for the active character (Hunter)
    const statsSection = page
      .locator('div')
      .filter({ hasText: /Mobility|Resilience|Recovery|Discipline|Intellect|Strength/ });

    await expect(statsSection.getByText('Mobility')).toBeVisible();
    await expect(statsSection.getByText('Resilience')).toBeVisible();
    await expect(statsSection.getByText('Recovery')).toBeVisible();
    await expect(statsSection.getByText('Discipline')).toBeVisible();
    await expect(statsSection.getByText('Intellect')).toBeVisible();
    await expect(statsSection.getByText('Strength')).toBeVisible();

    // Verify stats have numeric values
    await expect(statsSection.getByText('100')).toBeVisible(); // Mobility value
    await expect(statsSection.getByText('61')).toBeVisible(); // Resilience value
  });

  test('displays vault section with storage information', async ({ page }) => {
    // Verify vault section exists
    const vaultSection = page.locator('button').filter({ hasText: 'Vault' });
    await expect(vaultSection).toBeVisible();

    // Check for power level in vault
    await expect(vaultSection).toContainText(/\d{4}/);

    // Verify currency information is displayed
    await expect(page.getByText(/Glimmer/)).toBeVisible();
    await expect(page.getByText(/Bright Dust/)).toBeVisible();

    // Check storage counters
    await expect(page.getByText(/\d+\/\d+/)).toBeVisible(); // Storage format like "405/700"
  });

  test('displays postmaster sections', async ({ page }) => {
    // Verify postmaster sections are present
    const postmasterHeadings = page.getByRole('heading', { name: /postmaster/i });
    await expect(postmasterHeadings.first()).toBeVisible();

    // Check postmaster item counts
    await expect(page.getByText(/\(\d+\/\d+\)/)).toBeVisible(); // Format like "(1/21)"
  });

  test('displays main inventory sections', async ({ page }) => {
    // Verify main section headings exist and are clickable
    await expect(page.getByRole('heading', { name: 'Weapons' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Armor' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'General' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();

    // Verify section toggle buttons work
    const weaponsButton = page.getByRole('button', { name: 'Weapons' });
    const armorButton = page.getByRole('button', { name: 'Armor' });

    await expect(weaponsButton).toBeVisible();
    await expect(armorButton).toBeVisible();

    // Sections should be expanded by default
    await expect(weaponsButton).toHaveAttribute('aria-expanded', 'true');
    await expect(armorButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('displays weapons section with item categories', async ({ page }) => {
    // Verify weapons section contains items
    const weaponsSection = page.locator('[aria-label="Weapons"]');
    await expect(weaponsSection).toBeVisible();

    // Check for kinetic weapons category
    await expect(page.getByText('Kinetic Weapons')).toBeVisible();

    // Verify some weapon items are displayed
    await expect(page.getByText('Auto Rifle')).toBeVisible();
    await expect(page.getByText('Pulse Rifle')).toBeVisible();
    await expect(page.getByText('Hand Cannon')).toBeVisible();
  });

  test('displays armor section with equipment slots', async ({ page }) => {
    // Verify armor section contains equipment
    const armorSection = page.locator('[aria-label="Armor"]');
    await expect(armorSection).toBeVisible();

    // Check for armor slot categories
    await expect(page.getByText('Helmet')).toBeVisible();
    await expect(page.getByText('Chest Armor')).toBeVisible();
    await expect(page.getByText('Leg Armor')).toBeVisible();
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
    // Verify no critical error states are shown
    await expect(page.locator('.developer-settings')).not.toBeVisible();
    await expect(page.locator('.login-required')).not.toBeVisible();

    // Verify main content is loaded
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByText('Loading')).not.toBeVisible();
  });
});
