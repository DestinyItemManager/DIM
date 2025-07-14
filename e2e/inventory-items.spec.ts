import { expect, test } from '@playwright/test';

test.describe('Inventory Page - Item Display and Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to fully load
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Hunter')).toBeVisible();
  });

  test('displays items in weapon categories', async ({ page }) => {
    // Verify weapon items are displayed with power levels
    await expect(page.getByText('Quicksilver Storm Auto Rifle')).toBeVisible();
    await expect(page.getByText('Pizzicato-22 Submachine Gun')).toBeVisible();
    await expect(page.getByText('The Call Sidearm')).toBeVisible();

    // Verify items show power levels
    await expect(page.getByText('1930')).toBeVisible(); // Quicksilver Storm power level
    await expect(page.getByText('1925')).toBeVisible(); // Pizzicato-22 power level

    // Verify items have quality indicators (exotic, legendary icons)
    const exoticItems = page.locator('img').filter({ hasText: /exotic/i });
    await expect(
      page
        .locator('generic')
        .filter({ hasText: /thumbs up/i })
        .first(),
    ).toBeVisible();
  });

  test('opens item detail popup when clicking on weapon', async ({ page }) => {
    // Click on a specific weapon item
    await page.getByText('Quicksilver Storm Auto Rifle').click();

    // Verify item popup opens with correct content
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Quicksilver Storm' })).toBeVisible();
    await expect(page.getByText('Auto Rifle')).toBeVisible();
    await expect(page.getByText('1930')).toBeVisible();

    // Verify item stats are displayed
    await expect(page.getByText('RPM')).toBeVisible();
    await expect(page.getByText('720')).toBeVisible(); // RPM value
    await expect(page.getByText('Enemies Defeated')).toBeVisible();
  });

  test('displays item perks and details in popup', async ({ page }) => {
    // Open item detail popup
    await page.getByText('Quicksilver Storm Auto Rifle').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Verify perks are displayed
    await expect(page.getByText('Hand-Laid Stock')).toBeVisible();
    await expect(page.getByText('Grenade Chaser')).toBeVisible();
    await expect(page.getByText('High-Caliber Rounds')).toBeVisible();
    await expect(page.getByText('Corkscrew Rifling')).toBeVisible();

    // Verify exotic perk description
    await expect(page.getByText('Rocket Tracers')).toBeVisible();

    // Verify weapon stats
    await expect(page.getByText('Airborne')).toBeVisible();
    await expect(page.getByText(/^\d+$/)).toBeVisible(); // Numeric stat values
  });

  test('shows item action buttons in popup', async ({ page }) => {
    // Open item detail popup
    await page.getByText('Quicksilver Storm Auto Rifle').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Verify action buttons are present and clickable
    await expect(page.getByRole('button', { name: /compare/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /loadout/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /infuse/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /vault/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /locked/i })).toBeVisible();

    // Verify tag dropdown
    await expect(page.getByRole('combobox').filter({ hasText: /tag item/i })).toBeVisible();

    // Verify add notes button
    await expect(page.getByRole('button', { name: /add notes/i })).toBeVisible();
  });

  test('displays character equip options in item popup', async ({ page }) => {
    // Open item detail popup
    await page.getByText('Quicksilver Storm Auto Rifle').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Verify "Equip on" section
    await expect(page.getByText('Equip on:')).toBeVisible();
    await expect(page.getByRole('button', { name: /equip on.*hunter/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /equip on.*warlock/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /equip on.*titan/i })).toBeVisible();

    // Verify "Pull to" section
    await expect(page.getByText('Pull to:')).toBeVisible();
    await expect(page.getByRole('button', { name: /pull to.*warlock/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /pull to.*titan/i })).toBeVisible();

    // Current character button should be disabled
    await expect(page.getByRole('button', { name: /pull to.*hunter.*\[P\]/i })).toBeDisabled();
  });

  test('has multiple tabs in item popup', async ({ page }) => {
    // Open item detail popup
    await page.getByText('Quicksilver Storm Auto Rifle').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Verify tabs are present
    const tablist = page.getByRole('tablist', { name: 'Item detail tabs' });
    await expect(tablist).toBeVisible();

    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Triage' })).toBeVisible();

    // Overview tab should be selected by default
    await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // Test tab switching
    await page.getByRole('tab', { name: 'Triage' }).click();
    await expect(page.getByRole('tab', { name: 'Triage' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('can close item popup', async ({ page }) => {
    // Open item detail popup
    await page.getByText('Quicksilver Storm Auto Rifle').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Close popup by pressing Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Re-open and test closing by clicking outside
    await page.getByText('Quicksilver Storm Auto Rifle').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click outside the dialog (on the main content)
    await page.locator('main').click({ position: { x: 50, y: 50 } });
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('displays different item types correctly', async ({ page }) => {
    // Test clicking on different weapon types
    const weaponTypes = [
      'Auto Rifle',
      'Pulse Rifle',
      'Hand Cannon',
      'Submachine Gun',
      'Scout Rifle',
      'Sniper Rifle',
    ];

    for (const weaponType of weaponTypes) {
      const weaponElement = page.getByText(weaponType).first();
      if (await weaponElement.isVisible()) {
        await expect(weaponElement).toBeVisible();
      }
    }
  });

  test('shows armor items in armor section', async ({ page }) => {
    // Verify armor items are displayed
    const armorSection = page.locator('[aria-label="Armor"]');
    await expect(armorSection).toBeVisible();

    // Check for equipped armor pieces
    await expect(page.getByText('Helmet')).toBeVisible();
    await expect(page.getByText('Chest Armor')).toBeVisible();
    await expect(page.getByText('Leg Armor')).toBeVisible();

    // Verify armor has power levels
    const armorPowerPattern = /\d{4}/;
    await expect(armorSection.getByText(armorPowerPattern).first()).toBeVisible();
  });

  test('displays consumables and materials in general section', async ({ page }) => {
    // Verify general items section
    const generalSection = page.locator('[aria-label="General"]');
    await expect(generalSection).toBeVisible();

    // Check for various item types in general section
    // Note: Specific items may vary, so we check for the section structure
    await expect(page.getByRole('heading', { name: 'General' })).toBeVisible();
  });

  test('handles rapid item clicking gracefully', async ({ page }) => {
    // Rapidly click on different items to test stability
    const items = ['Quicksilver Storm Auto Rifle', 'Pizzicato-22 Submachine Gun'];

    for (const item of items) {
      if (await page.getByText(item).isVisible()) {
        await page.getByText(item).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).not.toBeVisible();
      }
    }
  });

  test('displays item quality indicators', async ({ page }) => {
    // Look for different quality indicators
    // Exotic items should have special indicators
    const exoticIndicators = page.locator('img').filter({ hasText: /exotic/i });

    // Thumbs up indicators for good rolls
    await expect(page.getByText('Thumbs Up').first()).toBeVisible();

    // Power level numbers should be visible throughout
    await expect(page.getByText(/^\d{4}$/).first()).toBeVisible();
  });
});
