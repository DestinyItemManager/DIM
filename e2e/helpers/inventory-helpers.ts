import { Page, expect } from '@playwright/test';

/**
 * Helper functions for DIM inventory e2e tests
 * These functions encapsulate common actions and waits to make tests more maintainable
 */

export class InventoryHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to the inventory page and wait for it to load
   */
  async navigateToInventory(): Promise<void> {
    await this.page.goto('/');
    await this.waitForInventoryLoad();
  }

  /**
   * Wait for the inventory page to fully load
   */
  async waitForInventoryLoad(): Promise<void> {
    await expect(this.page.locator('header')).toBeVisible({ timeout: 15000 });
    await expect(this.page.getByText('Hunter')).toBeVisible();
  }

  /**
   * Common assertions for page structure
   */
  async verifyPageStructure(): Promise<void> {
    await expect(this.page.locator('header')).toBeVisible();
    await expect(this.page.getByText('Hunter')).toBeVisible();
    await expect(this.page.getByText('Warlock')).toBeVisible();
    await expect(this.page.getByText('Titan')).toBeVisible();
  }

  /**
   * Verify header elements are present
   */
  async verifyHeader(): Promise<void> {
    await expect(this.page.locator('header')).toBeVisible();
    await expect(this.page.locator('img').first()).toBeVisible();
    await expect(this.page.getByRole('combobox', { name: /search/i })).toBeVisible();
    await expect(this.page.getByRole('button', { name: /menu/i })).toBeVisible();
  }

  /**
   * Verify all three characters are displayed with power levels
   */
  async verifyAllCharacters(): Promise<void> {
    const powerLevelPattern = /\d{4}/;

    // Hunter
    const hunterSection = this.page.locator('button').filter({ hasText: 'Hunter' });
    await expect(hunterSection).toBeVisible();
    await expect(hunterSection).toContainText('Vidmaster');
    await expect(hunterSection).toContainText(powerLevelPattern);

    // Warlock
    const warlockSection = this.page.locator('button').filter({ hasText: 'Warlock' });
    await expect(warlockSection).toBeVisible();
    await expect(warlockSection).toContainText('Star Baker');
    await expect(warlockSection).toContainText(powerLevelPattern);

    // Titan
    const titanSection = this.page.locator('button').filter({ hasText: 'Titan' });
    await expect(titanSection).toBeVisible();
    await expect(titanSection).toContainText('MMXXII');
    await expect(titanSection).toContainText(powerLevelPattern);
  }

  /**
   * Verify character stats are displayed
   */
  async verifyCharacterStats(): Promise<void> {
    const statsSection = this.page.locator('div').filter({
      hasText: /Mobility|Resilience|Recovery|Discipline|Intellect|Strength/,
    });

    const statNames = ['Mobility', 'Resilience', 'Recovery', 'Discipline', 'Intellect', 'Strength'];
    for (const statName of statNames) {
      await expect(statsSection.getByText(statName)).toBeVisible();
    }
  }

  /**
   * Verify main inventory sections
   */
  async verifyInventorySections(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Weapons' })).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'Armor' })).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'General' })).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'Inventory' })).toBeVisible();

    // Verify section buttons are expanded
    const weaponsButton = this.page.getByRole('button', { name: 'Weapons', exact: true });
    const armorButton = this.page.getByRole('button', { name: 'Armor', exact: true });

    await expect(weaponsButton).toBeVisible();
    await expect(armorButton).toBeVisible();
    await expect(weaponsButton).toHaveAttribute('aria-expanded', 'true');
    await expect(armorButton).toHaveAttribute('aria-expanded', 'true');
  }

  /**
   * Verify postmaster sections
   */
  async verifyPostmaster(): Promise<void> {
    const postmasterHeadings = this.page.getByRole('heading', { name: /postmaster/i });
    await expect(postmasterHeadings.first()).toBeVisible();
    await expect(this.page.getByText(/\(\d+\/\d+\)/).first()).toBeVisible();
  }

  /**
   * Verify weapons section content
   */
  async verifyWeaponsSection(): Promise<void> {
    await expect(this.page.getByText('Kinetic Weapons')).toBeVisible();
    await expect(this.page.getByText('Auto Rifle')).toBeVisible();
    await expect(this.page.getByText('Pulse Rifle')).toBeVisible();
    await expect(this.page.getByText('Hand Cannon')).toBeVisible();
  }

  /**
   * Verify armor section content
   */
  async verifyArmorSection(): Promise<void> {
    await expect(this.page.getByText('Helmet')).toBeVisible();
    await expect(this.page.getByText('Chest Armor')).toBeVisible();
    await expect(this.page.getByText('Leg Armor')).toBeVisible();
  }

  /**
   * Verify common item display elements
   */
  async verifyItemDisplay(): Promise<void> {
    await expect(this.page.getByText('Quicksilver Storm Auto Rifle')).toBeVisible();
    await expect(this.page.getByText('Pizzicato-22 Submachine Gun')).toBeVisible();
    await expect(this.page.getByText('The Call Sidearm')).toBeVisible();

    // Verify power levels are displayed
    await expect(this.page.getByText('1930')).toBeVisible();
    await expect(this.page.getByText('1925')).toBeVisible();
  }

  /**
   * Verify search input is present and functional
   */
  async verifySearchInput(): Promise<void> {
    const searchInput = this.page.getByRole('combobox', { name: /search/i });
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /search/i);
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
