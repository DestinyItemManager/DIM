import { expect, test } from '@playwright/test';
import { InventoryHelpers } from './helpers/inventory-helpers';

test.describe('Inventory Page - Comprehensive End-to-End Tests', () => {
  let helpers: InventoryHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new InventoryHelpers(page);
    await helpers.navigateToInventory();
  });

  test('complete item workflow - search, view details, and interact', async ({ page }) => {
    // Search for specific items
    await helpers.searchForItems('auto rifle');
    await helpers.verifySearchFiltering();

    // Open item details
    const weaponItem = page
      .getByText('Quicksilver Storm Auto Rifle')
      .or(page.getByText('Pizzicato-22 Submachine Gun'))
      .first();
    await weaponItem.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await helpers.verifyItemPopupContent();

    // Verify all action buttons are present
    await helpers.verifyItemPopupActions();

    // Verify character equipment options
    await helpers.verifyCharacterEquipOptions();

    // Test tab switching
    await helpers.verifyItemPopupTabs();
    await helpers.switchToItemTab('Triage');
    await helpers.switchToItemTab('Overview');

    // Close popup and clear search
    await helpers.closeItemDetail();
    await helpers.clearSearch();
  });

  test('character switching affects inventory display', async ({ page }) => {
    // Verify initial character (Hunter)
    await helpers.verifyCharacterSection('Hunter');
    await helpers.verifyCharacterStats();

    // Switch to Warlock
    await helpers.switchToCharacter('Warlock');
    await helpers.verifyCharacterStats();

    // Switch to Titan
    await helpers.switchToCharacter('Titan');
    await helpers.verifyCharacterStats();
  });

  test('inventory sections can be toggled and maintain state', async ({ page }) => {
    // Verify sections are expanded by default
    await helpers.verifySectionExpanded('Weapons');
    await helpers.verifySectionExpanded('Armor');
    await helpers.verifySectionExpanded('General');

    // Toggle weapons section
    await helpers.toggleSection('Weapons');

    // Search should still work with collapsed sections
    await helpers.searchForItems('is:weapon');
    await helpers.verifySearchFiltering();

    // Clear search
    await helpers.clearSearch();
  });

  test('search functionality with different query types', async ({ page }) => {
    // Test basic text search
    await helpers.searchForItems('quicksilver');
    await expect(page.getByText('Quicksilver Storm Auto Rifle')).toBeVisible();

    // Test filter search with suggestions
    await helpers.clearSearch();
    await helpers.verifySearchSuggestions('is:');
    await helpers.selectSearchSuggestion('is:weapon');
    await helpers.verifySearchFiltering();

    // Clear and test another filter
    await helpers.clearSearch();
    await helpers.searchForItems('auto rifle');
    await helpers.verifyItemTypesVisible(['Auto Rifle']);
  });

  test('vault and storage information is displayed correctly', async ({ page }) => {
    await helpers.verifyVaultSection();

    // Verify postmaster for each character
    await expect(page.getByRole('heading', { name: /postmaster/i }).first()).toBeVisible();
    await expect(page.getByText(/\(\d+\/\d+\)/).first()).toBeVisible(); // Postmaster item counts
  });

  test('rapid interactions do not break the interface', async ({ page }) => {
    // Rapidly open and close item popups
    const itemNames = ['Quicksilver Storm Auto Rifle', 'Pizzicato-22 Submachine Gun'];

    for (const itemName of itemNames) {
      if (await page.getByText(itemName).isVisible()) {
        await helpers.openItemDetail(itemName);
        await helpers.closeItemDetail();
        await page.waitForTimeout(100); // Small delay to prevent too rapid clicks
      }
    }

    // Verify page is still functional
    await helpers.verifyNoCriticalErrors();
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('item equipping workflow across characters', async ({ page }) => {
    // Open weapon details
    const weaponItem = page
      .getByText('Quicksilver Storm Auto Rifle')
      .or(page.getByText('Pizzicato-22 Submachine Gun'))
      .first();
    await weaponItem.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Verify current character (Hunter) is selected
    await expect(page.getByRole('button', { name: /pull to.*hunter.*\[P\]/i })).toBeDisabled();

    // Verify other characters are available for equipping
    await expect(page.getByRole('button', { name: /equip on.*warlock/i })).toBeEnabled();
    await expect(page.getByRole('button', { name: /equip on.*titan/i })).toBeEnabled();

    // Verify pull to other characters
    await expect(page.getByRole('button', { name: /pull to.*warlock/i })).toBeEnabled();
    await expect(page.getByRole('button', { name: /pull to.*titan/i })).toBeEnabled();

    await helpers.closeItemDetail();
  });

  test('search preserves state during other interactions', async ({ page }) => {
    // Apply search filter
    await helpers.searchForItems('is:weapon');
    await helpers.verifySearchFiltering();

    // Open and close item popup
    const weaponItem = page
      .getByText('Auto Rifle')
      .or(page.getByText('Quicksilver Storm Auto Rifle'))
      .first();
    await weaponItem.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await helpers.closeItemDetail();

    // Verify search is still active
    await expect(page.getByRole('combobox', { name: /search/i })).toHaveValue('is:weapon');
    await helpers.verifySearchFiltering();

    // Toggle a section
    await helpers.toggleSection('Armor');

    // Search should still be active
    await expect(page.getByRole('combobox', { name: /search/i })).toHaveValue('is:weapon');
  });

  test('keyboard navigation works throughout the interface', async ({ page }) => {
    // Focus search input with Tab
    await page.keyboard.press('Tab');
    await expect(page.getByRole('combobox', { name: /search/i })).toBeFocused();

    // Type to show suggestions
    await page.keyboard.type('is:');
    await expect(page.getByRole('listbox')).toBeVisible();

    // Navigate suggestions with arrows
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Should apply the selected suggestion
    await expect(page.getByRole('combobox', { name: /search/i })).toHaveValue(/is:/);
  });

  test('responsive layout maintains functionality', async ({ page }) => {
    // Test with different viewport sizes
    await page.setViewportSize({ width: 1024, height: 768 });
    await helpers.waitForLoadingComplete();

    // Basic functionality should still work
    await helpers.verifyCharacterSection('Hunter');
    await helpers.searchForItems('is:weapon');
    await helpers.verifySearchFiltering();

    // Test mobile size
    await page.setViewportSize({ width: 768, height: 1024 });
    await helpers.waitForLoadingComplete();

    // Core elements should still be accessible
    await expect(page.getByRole('main')).toBeVisible();
    await helpers.verifyNoCriticalErrors();
  });
});
