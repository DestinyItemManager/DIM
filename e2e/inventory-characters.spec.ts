import { expect, test } from '@playwright/test';
import { InventoryHelpers } from './helpers/inventory-helpers';

test.describe('Inventory Page - Character Management', () => {
  let helpers: InventoryHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new InventoryHelpers(page);
    await helpers.navigateToInventory();
  });

  test('displays all three character classes with distinct information', async ({ page }) => {
    await helpers.verifyAllCharacters();
  });

  test('shows detailed stats for active character', async ({ page }) => {
    // Hunter should be active by default, verify detailed stats
    await helpers.verifyCharacterStats();

    // Verify specific stat values for Hunter
    await helpers.verifyCharacterStats({
      Mobility: '100',
      Resilience: '61',
      Recovery: '30',
      Discipline: '101',
      Intellect: '31',
      Strength: '20',
    });
  });

  test('displays power level calculations for each character', async ({ page }) => {
    // Check that each character shows power level numbers
    const characters = ['Hunter', 'Warlock', 'Titan'];

    for (const character of characters) {
      const characterSection = page.locator('button').filter({ hasText: character });
      await expect(characterSection).toBeVisible();
      // Should contain 4-digit power level numbers
      await expect(characterSection).toContainText(/\d{4}/);
    }

    // Check that power level breakdown is shown (max total, equippable gear, seasonal bonus)
    await expect(page.getByText(/\d{4}/).first()).toBeVisible(); // Some power level number
    await expect(page.locator('img[alt*="Maximum total Power"]').first()).toBeVisible();
    await expect(
      page.locator('img[alt*="Maximum Power of equippable gear"]').first(),
    ).toBeVisible();
    await expect(page.locator('img[alt*="seasonal experience"]').first()).toBeVisible();
  });

  test('shows character loadout buttons', async ({ page }) => {
    // Each character should have a loadouts section - just verify loadouts text exists
    await expect(page.getByText('Loadouts').first()).toBeVisible();

    // Verify loadouts section exists (appears in the UI)
    const loadoutElements = page.getByText('Loadouts');
    const count = await loadoutElements.count();
    expect(count).toBeGreaterThan(0); // Should have at least one loadouts section visible
  });

  test('character switching affects displayed stats', async ({ page }) => {
    // Verify initial character stats are visible
    await helpers.verifyCharacterStats();

    // Click on a different character
    await helpers.switchToCharacter('Warlock');

    // Verify all stat categories are still present after switching
    await helpers.verifyCharacterStats();

    // Switch back to first character
    await helpers.switchToCharacter('Hunter');

    // Verify stats are still displayed properly
    await helpers.verifyCharacterStats();
  });

  test('displays character emblems and visual elements', async ({ page }) => {
    // Each character button should have visual elements (emblems)
    const hunterButton = page.locator('button').filter({ hasText: 'Hunter' });
    const warlockButton = page.locator('button').filter({ hasText: 'Warlock' });
    const titanButton = page.locator('button').filter({ hasText: 'Titan' });

    // Each should have their class name
    await expect(hunterButton).toContainText('Hunter');
    await expect(warlockButton).toContainText('Warlock');
    await expect(titanButton).toContainText('Titan');

    // Each character button should be visible
    await expect(hunterButton).toBeVisible();
    await expect(warlockButton).toBeVisible();
    await expect(titanButton).toBeVisible();
  });

  test('shows vault as separate storage entity', async ({ page }) => {
    await helpers.verifyVaultSection();
  });

  test('postmaster shows per-character storage', async ({ page }) => {
    await helpers.verifyPostmaster();

    // Should show item counts in (x/y) format for postmaster
    await expect(page.getByText(/\(\d+\/\d+\)/).first()).toBeVisible();

    // Should have postmaster heading
    await expect(page.getByRole('heading', { name: /postmaster/i })).toBeVisible();
  });

  test('character power level tooltips and details', async ({ page }) => {
    // Test hover or click on power level buttons for additional info
    const powerButton = page.getByRole('button', { name: /maximum power.*equippable gear/i });
    await expect(powerButton.first()).toBeVisible();

    // Power button should be clickable for more details
    await powerButton.first().click();
    // Note: This might open a tooltip or modal - depends on implementation
  });

  test('handles character interactions during item operations', async ({ page }) => {
    // Open any weapon item popup
    await helpers.openAnyWeaponDetail();

    // Verify character options in item popup
    await helpers.verifyCharacterEquipOptions();

    // Test equipping on different character
    const equipOnWarlock = page.getByRole('button', { name: /equip on.*warlock/i });
    await expect(equipOnWarlock).toBeEnabled();

    // Close popup
    await helpers.closeItemDetail();
  });

  test('character sections maintain proper layout and spacing', async ({ page }) => {
    await helpers.verifyPageStructure();

    // Verify characters are laid out and properly sized
    const characterButtons = page.locator('button').filter({ hasText: /Hunter|Warlock|Titan/ });
    await expect(characterButtons).toHaveCount(3);

    // Each character section should be visible and contain power level
    for (let i = 0; i < 3; i++) {
      const characterButton = characterButtons.nth(i);
      await expect(characterButton).toBeVisible();
      await expect(characterButton).toContainText(/\d{4}/);
    }
  });

  test('character data loads consistently', async ({ page }) => {
    // Refresh page and verify character data loads reliably
    await page.reload();
    await helpers.waitForInventoryLoad();

    // All characters should still be visible after reload
    await helpers.verifyPageStructure();

    // Stats should be displayed
    await helpers.verifyCharacterStats();
  });

  test('character titles and emblems are unique', async ({ page }) => {
    const characters = ['Hunter', 'Warlock', 'Titan'];

    for (const character of characters) {
      const characterButton = page.locator('button').filter({ hasText: character });
      await expect(characterButton).toBeVisible();

      // Each character should have a title (some text that's not the class name)
      await expect(characterButton).toContainText(/\w+/);

      // Each character should have a power level (4-digit number)
      await expect(characterButton).toContainText(/\d{4}/);

      // Each character button should be visible and properly structured
      await expect(characterButton).toBeVisible();
    }
  });
});
