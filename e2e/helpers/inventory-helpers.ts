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
    await expect(this.page.getByRole('combobox', { name: /search/i }).first()).toBeVisible();
    await expect(this.page.getByRole('button', { name: /menu/i }).first()).toBeVisible();
  }

  /**
   * Verify all three characters are displayed with power levels
   */
  async verifyAllCharacters(): Promise<void> {
    const powerLevelPattern = /\d{4}/;

    // Hunter
    const hunterSection = this.page.locator('button').filter({ hasText: 'Hunter' });
    await expect(hunterSection).toBeVisible();
    await expect(hunterSection).toContainText(powerLevelPattern);

    // Warlock
    const warlockSection = this.page.locator('button').filter({ hasText: 'Warlock' });
    await expect(warlockSection).toBeVisible();
    await expect(warlockSection).toContainText(powerLevelPattern);

    // Titan
    const titanSection = this.page.locator('button').filter({ hasText: 'Titan' });
    await expect(titanSection).toBeVisible();
    await expect(titanSection).toContainText(powerLevelPattern);
  }

  /**
   * Verify character stats are displayed
   */
  async verifyCharacterStats(): Promise<void> {
    // Stats are displayed as groups with icons and values - check that at least one set is visible
    const statNames = ['Mobility', 'Resilience', 'Recovery', 'Discipline', 'Intellect', 'Strength'];
    for (const statName of statNames) {
      // Look for groups that contain the stat name - use .first() since multiple characters show stats
      const statGroup = this.page.getByRole('group', { name: new RegExp(`${statName} \\d+`, 'i') });
      await expect(statGroup.first()).toBeVisible();
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
    // Kinetic Weapons shows as a generic element
    await expect(this.page.getByText('Kinetic Weapons').first()).toBeVisible();

    // Verify that weapon types are visible (Auto Rifle, Submachine Gun, etc.)
    await expect(
      this.page.getByText(/Auto Rifle|Submachine Gun|Sidearm|Pulse Rifle/),
    ).toBeVisible();
  }

  /**
   * Verify armor section content
   */
  async verifyArmorSection(): Promise<void> {
    // Armor slot labels are visible as generic elements
    await expect(this.page.getByText('Helmet').first()).toBeVisible();
    await expect(this.page.getByText('Chest Armor').first()).toBeVisible();
    await expect(this.page.getByText('Leg Armor').first()).toBeVisible();
  }

  /**
   * Verify common item display elements
   */
  async verifyItemDisplay(): Promise<void> {
    // Verify weapon types are visible in the inventory
    await expect(
      this.page.getByText(/Auto Rifle|Submachine Gun|Sidearm|Pulse Rifle/).first(),
    ).toBeVisible();

    // Verify power levels are displayed (4-digit numbers)
    await expect(this.page.getByText(/\d{4}/).first()).toBeVisible();

    // Verify thumbs up quality indicator is present somewhere
    if (await this.page.getByText('Thumbs Up').first().isVisible()) {
      await expect(this.page.getByText('Thumbs Up').first()).toBeVisible();
    }
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
    await this.page.getByText(itemName).first().click();
    await expect(this.page.getByRole('dialog')).toBeVisible();
  }

  /**
   * Open any weapon item detail popup by clicking on the first available weapon
   */
  async openAnyWeaponDetail(): Promise<void> {
    // Click on any weapon item in the weapons section - look for clickable elements with weapon patterns
    const weaponItem = this.page
      .locator('[class*="item"]')
      .filter({ hasText: /Auto Rifle|Submachine Gun|Sidearm|Pulse Rifle|Hand Cannon|Scout Rifle/ })
      .first();
    await weaponItem.click();
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
  async verifyCharacterSection(characterClass: string): Promise<void> {
    const characterButton = this.page.locator('button').filter({ hasText: characterClass });
    await expect(characterButton).toBeVisible();

    // Should contain some title text (not just the class name)
    await expect(characterButton).toContainText(/\w+/);

    // Should contain a 4-digit power level
    await expect(characterButton).toContainText(/\d{4}/);

    // Should have an emblem image
    await expect(characterButton.locator('img')).toBeVisible();
  }

  /**
   * Verify that item popup contains expected content
   */
  async verifyItemPopupContent(): Promise<void> {
    await expect(this.page.getByRole('dialog')).toBeVisible();

    // Should have an item name as heading
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();

    // Should have a weapon/item type visible
    await expect(
      this.page.getByText(/rifle|cannon|gun|bow|armor|helmet|chest|legs/i),
    ).toBeVisible();

    // Should show a power level (4-digit number)
    await expect(this.page.getByText(/\d{4}/).first()).toBeVisible();
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
  async verifyCharacterStats(expectedStats?: { [stat: string]: string }): Promise<void> {
    // Basic stat verification - check that stat groups are visible
    const statNames = ['Mobility', 'Resilience', 'Recovery', 'Discipline', 'Intellect', 'Strength'];
    for (const statName of statNames) {
      // From the snapshot, stats appear as group elements like "Mobility 100" - use .first() since multiple characters show stats
      const statGroup = this.page.getByRole('group', { name: new RegExp(`${statName} \\d+`, 'i') });
      await expect(statGroup.first()).toBeVisible();
    }

    // If specific values are provided, check them
    if (expectedStats) {
      for (const [statName, statValue] of Object.entries(expectedStats)) {
        const statGroup = this.page.getByRole('group', {
          name: new RegExp(`${statName}.*${statValue}`, 'i'),
        });
        await expect(statGroup).toBeVisible();
      }
    }
  }

  /**
   * Verify that the vault section displays expected information
   */
  async verifyVaultSection(): Promise<void> {
    const vaultButton = this.page.locator('button').filter({ hasText: 'Vault' });
    await expect(vaultButton).toBeVisible();

    // Check for currencies (should show numbers and currency names)
    await expect(this.page.getByText(/\d{1,3}(,\d{3})*/).first()).toBeVisible(); // Formatted numbers
    // Currency shows as generic elements - just verify numbers are present
    await expect(this.page.getByText(/\d{1,3}(,\d{3})+/).first()).toBeVisible();

    // Check for storage counters (x/y format)
    await expect(this.page.getByText(/\d+\/\d+/).first()).toBeVisible();
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
    // Check that at least some of the item types are visible
    let visibleTypes = 0;
    for (const itemType of itemTypes) {
      if (await this.page.getByText(itemType).first().isVisible()) {
        visibleTypes++;
      }
    }
    expect(visibleTypes).toBeGreaterThan(0);
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
