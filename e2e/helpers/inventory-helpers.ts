import { Page, expect } from '@playwright/test';

/**
 * Helper functions for DIM inventory e2e tests
 * These functions encapsulate common actions and waits to make tests more maintainable
 */

export class InventoryHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the inventory page to fully load
   */
  async waitForInventoryLoad(): Promise<void> {
    await expect(this.page.locator('main[aria-label="Inventory"]')).toBeVisible({ timeout: 15000 });
  }

  /**
   * Open an item detail popup by clicking on an item
   */
  async openItemDetail(itemName: string): Promise<void> {
    await this.page.getByText(itemName).click();
    await expect(this.page.getByRole('dialog')).toBeVisible();
  }

  /**
   * Close any open item detail popup
   */
  async closeItemDetail(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.page.getByRole('dialog')).not.toBeVisible();
  }

  /**
   * Perform a search and wait for results
   */
  async searchForItems(query: string): Promise<void> {
    const searchInput = this.page.getByRole('combobox', { name: /search/i });
    await searchInput.fill(query);

    // Wait for search to process
    await this.page.waitForTimeout(1000);
  }

  /**
   * Clear the search input
   */
  async clearSearch(): Promise<void> {
    const searchInput = this.page.getByRole('combobox', { name: /search/i });
    await searchInput.clear();
  }

  /**
   * Switch to a different character
   */
  async switchToCharacter(characterClass: 'Hunter' | 'Warlock' | 'Titan'): Promise<void> {
    const characterButton = this.page.locator('button').filter({ hasText: characterClass });
    await characterButton.click();

    // Wait for character switch to complete
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify that a character section displays expected information
   */
  async verifyCharacterSection(
    characterClass: string,
    expectedTitle: string,
    expectedPowerLevel: string,
  ): Promise<void> {
    const characterButton = this.page.locator('button').filter({ hasText: characterClass });
    await expect(characterButton).toBeVisible();
    await expect(characterButton).toContainText(expectedTitle);
    await expect(characterButton).toContainText(expectedPowerLevel);
  }

  /**
   * Verify that item popup contains expected content
   */
  async verifyItemPopupContent(expectedItemName: string, expectedType: string): Promise<void> {
    await expect(this.page.getByRole('dialog')).toBeVisible();
    await expect(this.page.getByRole('heading', { name: expectedItemName })).toBeVisible();
    await expect(this.page.getByText(expectedType)).toBeVisible();
  }

  /**
   * Verify that item popup has all expected action buttons
   */
  async verifyItemPopupActions(): Promise<void> {
    await expect(this.page.getByRole('button', { name: /compare/i })).toBeVisible();
    await expect(this.page.getByRole('button', { name: /loadout/i })).toBeVisible();
    await expect(this.page.getByRole('button', { name: /infuse/i })).toBeVisible();
    await expect(this.page.getByRole('button', { name: /vault/i })).toBeVisible();
    await expect(this.page.getByRole('button', { name: /locked/i })).toBeVisible();
  }

  /**
   * Verify character equipment options in item popup
   */
  async verifyCharacterEquipOptions(): Promise<void> {
    await expect(this.page.getByText('Equip on:')).toBeVisible();
    await expect(this.page.getByRole('button', { name: /equip on.*hunter/i })).toBeVisible();
    await expect(this.page.getByRole('button', { name: /equip on.*warlock/i })).toBeVisible();
    await expect(this.page.getByRole('button', { name: /equip on.*titan/i })).toBeVisible();

    await expect(this.page.getByText('Pull to:')).toBeVisible();
  }

  /**
   * Verify that a specific inventory section is visible and expanded
   */
  async verifySectionExpanded(
    sectionName: 'Weapons' | 'Armor' | 'General' | 'Inventory',
  ): Promise<void> {
    const sectionButton = this.page.getByRole('button', { name: sectionName });
    await expect(sectionButton).toBeVisible();
    await expect(sectionButton).toHaveAttribute('aria-expanded', 'true');
  }

  /**
   * Toggle an inventory section (expand/collapse)
   */
  async toggleSection(sectionName: 'Weapons' | 'Armor' | 'General' | 'Inventory'): Promise<void> {
    const sectionButton = this.page.getByRole('button', { name: sectionName });
    await sectionButton.click();
  }

  /**
   * Verify that character stats are displayed with expected values
   */
  async verifyCharacterStats(expectedStats: { [stat: string]: string }): Promise<void> {
    const statsContainer = this.page
      .locator('div')
      .filter({ hasText: /Mobility.*Resilience.*Recovery/ });

    for (const [statName, statValue] of Object.entries(expectedStats)) {
      await expect(statsContainer.getByText(statName)).toBeVisible();
      await expect(statsContainer.getByText(statValue)).toBeVisible();
    }
  }

  /**
   * Verify that the vault section displays expected information
   */
  async verifyVaultSection(): Promise<void> {
    const vaultButton = this.page.locator('button').filter({ hasText: 'Vault' });
    await expect(vaultButton).toBeVisible();

    // Check for currencies
    await expect(this.page.getByText(/Glimmer/)).toBeVisible();
    await expect(this.page.getByText(/Bright Dust/)).toBeVisible();

    // Check for storage counters
    await expect(this.page.getByText(/\d+\/\d+/)).toBeVisible();
  }

  /**
   * Verify search suggestions appear when typing
   */
  async verifySearchSuggestions(partialQuery: string): Promise<void> {
    const searchInput = this.page.getByRole('combobox', { name: /search/i });
    await searchInput.fill(partialQuery);

    await expect(this.page.getByRole('listbox')).toBeVisible();
  }

  /**
   * Select a search suggestion from the dropdown
   */
  async selectSearchSuggestion(suggestionText: string): Promise<void> {
    await expect(this.page.getByRole('listbox')).toBeVisible();
    await this.page.getByRole('option', { name: new RegExp(suggestionText, 'i') }).click();
  }

  /**
   * Verify that search filtering is working by checking item count
   */
  async verifySearchFiltering(): Promise<void> {
    await expect(this.page.getByText(/\d+ items/)).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify that specific item types are visible in the inventory
   */
  async verifyItemTypesVisible(itemTypes: string[]): Promise<void> {
    for (const itemType of itemTypes) {
      await expect(this.page.getByText(itemType)).toBeVisible();
    }
  }

  /**
   * Wait for any loading states to complete
   */
  async waitForLoadingComplete(): Promise<void> {
    // Wait for any loading text to disappear
    await expect(this.page.getByText('Loading')).not.toBeVisible();

    // Ensure main content is visible
    await expect(this.page.getByRole('main')).toBeVisible();
  }

  /**
   * Verify that the page has no critical errors
   */
  async verifyNoCriticalErrors(): Promise<void> {
    await expect(this.page.locator('.developer-settings')).not.toBeVisible();
    await expect(this.page.locator('.login-required')).not.toBeVisible();
  }

  /**
   * Navigate to the inventory page and wait for it to load
   */
  async navigateToInventory(): Promise<void> {
    await this.page.goto('/');
    await this.waitForInventoryLoad();
  }

  /**
   * Verify that item popup tabs work correctly
   */
  async verifyItemPopupTabs(): Promise<void> {
    const tablist = this.page.getByRole('tablist', { name: 'Item detail tabs' });
    await expect(tablist).toBeVisible();

    await expect(this.page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    await expect(this.page.getByRole('tab', { name: 'Triage' })).toBeVisible();

    // Overview should be selected by default
    await expect(this.page.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  }

  /**
   * Switch between item popup tabs
   */
  async switchToItemTab(tabName: 'Overview' | 'Triage'): Promise<void> {
    await this.page.getByRole('tab', { name: tabName }).click();
    await expect(this.page.getByRole('tab', { name: tabName })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  }
}
