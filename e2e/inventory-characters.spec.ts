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
    // Check Hunter power level breakdown
    const hunterSection = page.locator('button').filter({ hasText: 'Hunter' }).locator('..');
    await expect(hunterSection.getByText('1936')).toBeVisible(); // Maximum total power
    await expect(hunterSection.getByText('1933')).toBeVisible(); // Equippable gear power
    await expect(hunterSection.getByText('3')).toBeVisible(); // Seasonal bonus

    // Check Warlock power levels
    const warlockSection = page.locator('button').filter({ hasText: 'Warlock' }).locator('..');
    await expect(warlockSection.getByText('1915')).toBeVisible();
    await expect(warlockSection.getByText('1912')).toBeVisible();

    // Check Titan power levels
    const titanSection = page.locator('button').filter({ hasText: 'Titan' }).locator('..');
    await expect(titanSection.getByText('1915')).toBeVisible();
    await expect(titanSection.getByText('1912')).toBeVisible();
  });

  test('shows character loadout buttons', async ({ page }) => {
    // Each character should have a loadouts button
    const hunterLoadout = page
      .locator('button')
      .filter({ hasText: 'Hunter' })
      .getByText('Loadouts');
    const warlockLoadout = page
      .locator('button')
      .filter({ hasText: 'Warlock' })
      .getByText('Loadouts');
    const titanLoadout = page.locator('button').filter({ hasText: 'Titan' }).getByText('Loadouts');

    await expect(hunterLoadout).toBeVisible();
    await expect(warlockLoadout).toBeVisible();
    await expect(titanLoadout).toBeVisible();
  });

  test('character switching affects displayed stats', async ({ page }) => {
    // Get initial stats (Hunter)
    const initialMobility = page.getByText('Mobility').locator('..').getByText('100');
    await expect(initialMobility).toBeVisible();

    // Click on Warlock character
    await helpers.switchToCharacter('Warlock');

    // Stats should change to Warlock stats
    await helpers.verifyCharacterStats({
      Mobility: '47',
      Resilience: '44',
      Recovery: '41',
    });
  });

  test('displays character emblems and visual elements', async ({ page }) => {
    // Each character button should have visual elements (emblems)
    const hunterButton = page.locator('button').filter({ hasText: 'Hunter' });
    const warlockButton = page.locator('button').filter({ hasText: 'Warlock' });
    const titanButton = page.locator('button').filter({ hasText: 'Titan' });

    // Each should contain an image (emblem)
    await expect(hunterButton.locator('img')).toBeVisible();
    await expect(warlockButton.locator('img')).toBeVisible();
    await expect(titanButton.locator('img')).toBeVisible();

    // Each should have their class name
    await expect(hunterButton).toContainText('Hunter');
    await expect(warlockButton).toContainText('Warlock');
    await expect(titanButton).toContainText('Titan');
  });

  test('shows vault as separate storage entity', async ({ page }) => {
    await helpers.verifyVaultSection();
  });

  test('postmaster shows per-character storage', async ({ page }) => {
    await helpers.verifyPostmaster();

    // Should show item counts for different characters
    await expect(page.getByText('(1/21)')).toBeVisible(); // Hunter postmaster
    await expect(page.getByText('(0/21)')).toBeVisible(); // Other characters
  });

  test('character power level tooltips and details', async ({ page }) => {
    // Test hover or click on power level buttons for additional info
    const powerButton = page.getByRole('button', { name: /maximum power.*equippable gear/i });
    await expect(powerButton).toBeVisible();

    // Power button should be clickable for more details
    await powerButton.click();
    // Note: This might open a tooltip or modal - depends on implementation
  });

  test('handles character interactions during item operations', async ({ page }) => {
    // Open an item popup
    await helpers.openItemDetail('Quicksilver Storm Auto Rifle');

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
    await helpers.verifyCharacterSection('Hunter', 'Vidmaster', '1923');
    await helpers.verifyCharacterSection('Warlock', 'Star Baker', '1903');
    await helpers.verifyCharacterSection('Titan', 'MMXXII', '1903');
  });
});
