import { expect, test } from '@playwright/test';

test.describe('Inventory Page - Character Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to fully load
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Hunter')).toBeVisible();
  });

  test('displays all three character classes with distinct information', async ({ page }) => {
    // Verify Hunter character
    const hunterButton = page.locator('button').filter({ hasText: 'Hunter' });
    await expect(hunterButton).toBeVisible();
    await expect(hunterButton).toContainText('Vidmaster');
    await expect(hunterButton).toContainText('1923');

    // Verify Warlock character
    const warlockButton = page.locator('button').filter({ hasText: 'Warlock' });
    await expect(warlockButton).toBeVisible();
    await expect(warlockButton).toContainText('Star Baker');
    await expect(warlockButton).toContainText('1903');

    // Verify Titan character
    const titanButton = page.locator('button').filter({ hasText: 'Titan' });
    await expect(titanButton).toBeVisible();
    await expect(titanButton).toContainText('MMXXII');
    await expect(titanButton).toContainText('1903');
  });

  test('shows detailed stats for active character', async ({ page }) => {
    // Hunter should be active by default, verify detailed stats
    const statsContainer = page
      .locator('div')
      .filter({ hasText: /Mobility.*Resilience.*Recovery/ });

    // Verify all stat categories are present
    await expect(statsContainer.getByText('Mobility')).toBeVisible();
    await expect(statsContainer.getByText('Resilience')).toBeVisible();
    await expect(statsContainer.getByText('Recovery')).toBeVisible();
    await expect(statsContainer.getByText('Discipline')).toBeVisible();
    await expect(statsContainer.getByText('Intellect')).toBeVisible();
    await expect(statsContainer.getByText('Strength')).toBeVisible();

    // Verify specific stat values for Hunter
    await expect(statsContainer.getByText('100')).toBeVisible(); // Mobility
    await expect(statsContainer.getByText('61')).toBeVisible(); // Resilience
    await expect(statsContainer.getByText('30')).toBeVisible(); // Recovery
    await expect(statsContainer.getByText('101')).toBeVisible(); // Discipline
    await expect(statsContainer.getByText('31')).toBeVisible(); // Intellect
    await expect(statsContainer.getByText('20')).toBeVisible(); // Strength
  });

  test('displays power level calculations for each character', async ({ page }) => {
    // Check Hunter power level breakdown
    const hunterSection = page.locator('button').filter({ hasText: 'Hunter' }).locator('..');
    await expect(hunterSection.getByText('1936')).toBeVisible(); // Maximum total power
    await expect(hunterSection.getByText('1933')).toBeVisible(); // Equippable gear power
    await expect(hunterSection.getByText('3')).toBeVisible(); // Seasonal bonus

    // Check Warlock power levels
    const warlockSection = page.locator('button').filter({ hasText: 'Warlock' }).locator('..');
    await expect(warlockSection.getByText('1915')).toBeVisible(); // Maximum total power
    await expect(warlockSection.getByText('1912')).toBeVisible(); // Equippable gear power

    // Check Titan power levels
    const titanSection = page.locator('button').filter({ hasText: 'Titan' }).locator('..');
    await expect(titanSection.getByText('1915')).toBeVisible(); // Maximum total power
    await expect(titanSection.getByText('1912')).toBeVisible(); // Equippable gear power
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
    const warlockButton = page.locator('button').filter({ hasText: 'Warlock' });
    await warlockButton.click();

    // Stats should change to Warlock stats
    await page.waitForTimeout(1000); // Wait for character switch

    // Verify different stat values (Warlock has different stats)
    const statsContainer = page
      .locator('div')
      .filter({ hasText: /Mobility.*Resilience.*Recovery/ });
    await expect(statsContainer.getByText('47')).toBeVisible(); // Warlock Mobility
    await expect(statsContainer.getByText('44')).toBeVisible(); // Warlock Resilience
    await expect(statsContainer.getByText('41')).toBeVisible(); // Warlock Recovery
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
    // Vault should be separate from characters
    const vaultButton = page.locator('button').filter({ hasText: 'Vault' });
    await expect(vaultButton).toBeVisible();
    await expect(vaultButton).toContainText('1933'); // Vault power level

    // Vault should show storage information
    const vaultSection = vaultButton.locator('..');
    await expect(vaultSection.getByText(/\d+,\d+ Glimmer/)).toBeVisible();
    await expect(vaultSection.getByText(/\d+,\d+ Bright Dust/)).toBeVisible();

    // Storage counters
    await expect(vaultSection.getByText('405/700')).toBeVisible(); // General storage
    await expect(vaultSection.getByText('41/50')).toBeVisible(); // Some category
    await expect(vaultSection.getByText('40/50')).toBeVisible(); // Modifications
  });

  test('postmaster shows per-character storage', async ({ page }) => {
    // Each character should have their own postmaster
    const postmasterHeadings = page.getByRole('heading').filter({ hasText: /postmaster/i });
    await expect(postmasterHeadings.first()).toBeVisible();

    // Should show item counts for each character's postmaster
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
    await page.getByText('Quicksilver Storm Auto Rifle').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Verify character options in item popup
    await expect(page.getByText('Equip on:')).toBeVisible();
    await expect(page.getByRole('button', { name: /equip on.*hunter/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /equip on.*warlock/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /equip on.*titan/i })).toBeVisible();

    // Test equipping on different character
    const equipOnWarlock = page.getByRole('button', { name: /equip on.*warlock/i });
    await expect(equipOnWarlock).toBeEnabled();

    // Close popup
    await page.keyboard.press('Escape');
  });

  test('character sections maintain proper layout and spacing', async ({ page }) => {
    // Verify characters are laid out horizontally
    const characterButtons = page.locator('button').filter({ hasText: /Hunter|Warlock|Titan/ });
    await expect(characterButtons).toHaveCount(3);

    // Each character section should be visible and properly sized
    for (let i = 0; i < 3; i++) {
      const characterButton = characterButtons.nth(i);
      await expect(characterButton).toBeVisible();

      // Should contain power level
      await expect(characterButton).toContainText(/\d{4}/);
    }
  });

  test('character data loads consistently', async ({ page }) => {
    // Refresh page and verify character data loads reliably
    await page.reload();
    await expect(page.locator('main[aria-label="Inventory"]')).toBeVisible({ timeout: 15000 });

    // All characters should still be visible after reload
    await expect(page.getByText('Hunter')).toBeVisible();
    await expect(page.getByText('Warlock')).toBeVisible();
    await expect(page.getByText('Titan')).toBeVisible();

    // Stats should be displayed
    await expect(page.getByText('Mobility')).toBeVisible();
    await expect(page.getByText('100')).toBeVisible(); // Hunter mobility
  });

  test('character titles and emblems are unique', async ({ page }) => {
    // Each character should have unique title
    await expect(page.getByText('Vidmaster')).toBeVisible(); // Hunter
    await expect(page.getByText('Star Baker')).toBeVisible(); // Warlock
    await expect(page.getByText('MMXXII')).toBeVisible(); // Titan

    // Power levels should be character-specific
    await expect(page.getByText('1923')).toBeVisible(); // Hunter
    await expect(page.getByText('1903')).toBeVisible(); // Warlock & Titan (same level)
  });
});
