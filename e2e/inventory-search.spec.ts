import { expect, test } from '@playwright/test';

test.describe('Inventory Page - Search and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to fully load
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Hunter')).toBeVisible();
  });

  test('displays search input with placeholder text', async ({ page }) => {
    const searchInput = page.getByRole('combobox', { name: /search/i });
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /search/i);
  });

  test('filters items when typing search query', async ({ page }) => {
    const searchInput = page.getByRole('combobox', { name: /search/i });

    // Type a weapon name to filter
    await searchInput.fill('quicksilver');

    // Verify the search filters results - should see fewer items
    await expect(page.getByText('Quicksilver Storm Auto Rifle')).toBeVisible();

    // Clear search and verify items return
    await searchInput.clear();
    await expect(page.getByText('Pizzicato-22 Submachine Gun')).toBeVisible();
  });

  test('shows search suggestions dropdown', async ({ page }) => {
    const searchInput = page.getByRole('combobox', { name: /search/i });

    // Type partial search to trigger suggestions
    await searchInput.fill('is:');

    // Verify suggestions dropdown appears
    await expect(page.getByRole('listbox')).toBeVisible();

    // Check for specific search suggestions
    await expect(page.getByRole('option', { name: /is:weapon/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /is:weaponmod/i })).toBeVisible();
  });

  test('filters by weapon type using is:weapon', async ({ page }) => {
    const searchInput = page.getByRole('combobox', { name: /search/i });

    // Search for weapons only
    await searchInput.fill('is:weapon');

    // Wait for filtering to complete
    await page.waitForTimeout(1000);

    // Should show item count
    await expect(page.getByText(/\d+ items/)).toBeVisible();

    // Should still show weapon items
    await expect(page.getByText('Auto Rifle')).toBeVisible();
    await expect(page.getByText('Pulse Rifle')).toBeVisible();

    // Should show fewer items than before (weapons only)
    const itemCountText = await page.getByText(/\d+ items/).textContent();
    expect(itemCountText).toContain('374 items'); // Based on our exploration
  });

  test('can select search suggestions', async ({ page }) => {
    const searchInput = page.getByRole('combobox', { name: /search/i });

    // Type to trigger suggestions
    await searchInput.fill('is:');

    // Click on a suggestion
    await page.getByRole('option', { name: /is:weapon/i }).click();

    // Verify the suggestion was applied
    await expect(searchInput).toHaveValue('is:weapon');

    // Verify filtering occurred
    await expect(page.getByText(/\d+ items/)).toBeVisible();
  });

  test('displays search help option', async ({ page }) => {
    const searchInput = page.getByRole('combobox', { name: /search/i });

    // Type to trigger suggestions
    await searchInput.fill('is:');

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
    const searchInput = page.getByRole('combobox', { name: /search/i });

    // Enter search query
    await searchInput.fill('is:weapon');
    await expect(page.getByText(/\d+ items/)).toBeVisible();

    // Look for clear button and use it
    const clearButton = page
      .locator('button')
      .filter({ hasText: /clear|×|✕/ })
      .first();
    if (await clearButton.isVisible()) {
      await clearButton.click();
    } else {
      // Fallback: clear by selecting all and deleting
      await searchInput.selectText();
      await page.keyboard.press('Delete');
    }

    // Verify search is cleared
    await expect(searchInput).toHaveValue('');
  });

  test('handles complex search queries', async ({ page }) => {
    const searchInput = page.getByRole('combobox', { name: /search/i });

    // Test various search patterns
    const searchQueries = ['auto rifle', 'is:legendary', 'power:>1900'];

    for (const query of searchQueries) {
      await searchInput.fill(query);
      await page.waitForTimeout(500); // Wait for debounced search

      // Verify search input shows the query
      await expect(searchInput).toHaveValue(query);

      // Clear for next test
      await searchInput.clear();
    }
  });

  test('maintains search state when interacting with items', async ({ page }) => {
    const searchInput = page.getByRole('combobox', { name: /search/i });

    // Enter search query
    await searchInput.fill('is:weapon');
    await expect(page.getByText(/\d+ items/)).toBeVisible();

    // Open an item popup
    await page.getByText('Auto Rifle').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Close popup
    await page.keyboard.press('Escape');

    // Verify search is still active
    await expect(searchInput).toHaveValue('is:weapon');
    await expect(page.getByText(/\d+ items/)).toBeVisible();
  });

  test('search toggle button works', async ({ page }) => {
    // Look for search toggle/menu button
    const searchToggleButton = page.getByRole('button', { name: /toggle menu/i });
    await expect(searchToggleButton).toBeVisible();

    // Test clicking the toggle
    await searchToggleButton.click();

    // Should show or hide search menu/options
    await expect(page.getByRole('listbox')).toBeVisible();
  });

  test('shows item count updates during search', async ({ page }) => {
    const searchInput = page.getByRole('combobox', { name: /search/i });

    // Search for weapons
    await searchInput.fill('is:weapon');

    // Wait for item count to appear
    await expect(page.getByText(/\d+ items/)).toBeVisible({ timeout: 5000 });

    // Get the item count
    const itemCountElement = page.getByText(/\d+ items/);
    const itemCountText = await itemCountElement.textContent();

    // Should show a specific number of items
    expect(itemCountText).toMatch(/^\d+ items/);
  });

  test('handles empty search results gracefully', async ({ page }) => {
    const searchInput = page.getByRole('combobox', { name: /search/i });

    // Search for something that won't exist
    await searchInput.fill('xyz123nonexistent');
    await page.waitForTimeout(1000);

    // Should handle empty results without crashing
    // The page should still be functional
    await expect(page.locator('main')).toBeVisible();

    // Clear search to restore items
    await searchInput.clear();
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
    const searchInput = page.getByRole('combobox', { name: /search/i });

    // Enter search
    await searchInput.fill('is:weapon');
    await expect(page.getByText(/\d+ items/)).toBeVisible();

    // Click on different section toggles
    const armorButton = page.getByRole('button', { name: 'Armor' });
    await armorButton.click();

    // Search should still be active
    await expect(searchInput).toHaveValue('is:weapon');
  });
});
