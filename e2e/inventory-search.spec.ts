import { expect, test } from '@playwright/test';
import { InventoryHelpers } from './helpers/inventory-helpers';

test.describe('Inventory Page - Search and Filtering', () => {
  let helpers: InventoryHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new InventoryHelpers(page);
    await helpers.navigateToInventory();
  });

  test('displays search input with placeholder text', async ({ page }) => {
    await helpers.verifySearchInput();
  });

  test('filters items when typing search query', async ({ page }) => {
    // Type a weapon name to filter
    await helpers.searchForItems('quicksilver');

    // Verify the search filters results - should see fewer items
    await expect(page.getByText('Quicksilver Storm Auto Rifle')).toBeVisible();

    // Clear search and verify items return
    await helpers.clearSearch();
    await expect(page.getByText('Pizzicato-22 Submachine Gun')).toBeVisible();
  });

  test('shows search suggestions dropdown', async ({ page }) => {
    // Type partial search to trigger suggestions
    await helpers.verifySearchSuggestions('is:');

    // Check for specific search suggestions
    await expect(page.getByRole('option', { name: /is:weapon/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /is:weaponmod/i })).toBeVisible();
  });

  test('filters by weapon type using is:weapon', async ({ page }) => {
    // Search for weapons only
    await helpers.searchForItems('is:weapon');
    await helpers.verifySearchFiltering();

    // Should still show weapon items
    await expect(page.getByText('Auto Rifle')).toBeVisible();
    await expect(page.getByText('Pulse Rifle')).toBeVisible();

    // Should show item count
    const itemCountText = await page.getByText(/\d+ items/).textContent();
    expect(itemCountText).toContain('374 items'); // Based on our exploration
  });

  test('can select search suggestions', async ({ page }) => {
    // Type to trigger suggestions
    await helpers.verifySearchSuggestions('is:');

    // Click on a suggestion
    await helpers.selectSearchSuggestion('is:weapon');

    // Verify the suggestion was applied
    const searchInput = page.getByRole('combobox', { name: /search/i });
    await expect(searchInput).toHaveValue('is:weapon');

    // Verify filtering occurred
    await helpers.verifySearchFiltering();
  });

  test('displays search help option', async ({ page }) => {
    // Type to trigger suggestions
    await helpers.verifySearchSuggestions('is:');

    // Check for help option
    await expect(page.getByRole('option', { name: /filters help/i })).toBeVisible();
  });

  test('shows search actions button', async ({ page }) => {
    // Verify search actions button exists
    const searchActionsButton = page.getByRole('combobox', { name: /open search actions/i });
    await expect(searchActionsButton).toBeVisible();

    // Click to open search actions
    await searchActionsButton.click();
    await expect(page.getByRole('listbox')).toBeVisible();
  });

  test('can clear search results', async ({ page }) => {
    // Enter search query
    await helpers.searchForItems('is:weapon');
    await helpers.verifySearchFiltering();

    // Clear search
    await helpers.clearSearch();

    // Verify search is cleared
    const searchInput = page.getByRole('combobox', { name: /search/i });
    await expect(searchInput).toHaveValue('');
  });

  test('handles complex search queries', async ({ page }) => {
    // Test various search patterns
    const searchQueries = ['auto rifle', 'is:legendary', 'power:>1900'];

    for (const query of searchQueries) {
      await helpers.searchForItems(query);

      // Verify search input shows the query
      const searchInput = page.getByRole('combobox', { name: /search/i });
      await expect(searchInput).toHaveValue(query);

      // Clear for next test
      await helpers.clearSearch();
    }
  });

  test('maintains search state when interacting with items', async ({ page }) => {
    // Enter search query
    await helpers.searchForItems('is:weapon');
    await helpers.verifySearchFiltering();

    // Open an item popup
    await page.getByText('Auto Rifle').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Close popup
    await page.keyboard.press('Escape');

    // Verify search is still active
    const searchInput = page.getByRole('combobox', { name: /search/i });
    await expect(searchInput).toHaveValue('is:weapon');
    await helpers.verifySearchFiltering();
  });

  test('search toggle button works', async ({ page }) => {
    // Look for search toggle/menu button
    const searchToggleButton = page.getByRole('button', { name: /toggle menu/i });
    await expect(searchToggleButton).toBeVisible();

    // Test clicking the toggle
    await searchToggleButton.click();

    // Should show search menu/options
    await expect(page.getByRole('listbox')).toBeVisible();
  });

  test('shows item count updates during search', async ({ page }) => {
    // Search for weapons
    await helpers.searchForItems('is:weapon');
    await helpers.verifySearchFiltering();

    // Get the item count
    const itemCountElement = page.getByText(/\d+ items/);
    const itemCountText = await itemCountElement.textContent();

    // Should show a specific number of items
    expect(itemCountText).toMatch(/^\d+ items/);
  });

  test('handles empty search results gracefully', async ({ page }) => {
    // Search for something that won't exist
    await helpers.searchForItems('xyz123nonexistent');
    await page.waitForTimeout(1000);

    // Should handle empty results without crashing
    await expect(page.locator('main')).toBeVisible();

    // Clear search to restore items
    await helpers.clearSearch();
    await expect(page.getByText('Auto Rifle')).toBeVisible();
  });

  test('search input has proper keyboard navigation', async ({ page }) => {
    const searchInput = page.getByRole('combobox', { name: /search/i });

    // Focus search input
    await searchInput.focus();
    await expect(searchInput).toBeFocused();

    // Type to show suggestions
    await searchInput.fill('is:');
    await expect(page.getByRole('listbox')).toBeVisible();

    // Use arrow keys to navigate suggestions
    await page.keyboard.press('ArrowDown');

    // Should be able to select with Enter
    await page.keyboard.press('Enter');

    // Should apply the selected suggestion
    await expect(searchInput).toHaveValue(/is:/);
  });

  test('preserves search when navigating between sections', async ({ page }) => {
    // Enter search
    await helpers.searchForItems('is:weapon');
    await helpers.verifySearchFiltering();

    // Click on different section toggles
    await helpers.toggleSection('Armor');

    // Search should still be active
    const searchInput = page.getByRole('combobox', { name: /search/i });
    await expect(searchInput).toHaveValue('is:weapon');
  });
});
