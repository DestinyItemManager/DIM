import { expect, test } from '@playwright/test';
import { InventoryHelpers } from './helpers/inventory-helpers';

test.describe('Inventory Page - Item Display and Interactions', () => {
  let helpers: InventoryHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new InventoryHelpers(page);
    await helpers.navigateToInventory();
  });

  test('displays items in weapon categories', async ({ page }) => {
    await helpers.verifyItemDisplay();

    // Verify items have quality indicators (exotic, legendary icons)
    await expect(page.getByText('Thumbs Up').first()).toBeVisible();
  });

  test('opens item detail popup when clicking on weapon', async ({ page }) => {
    // Click on a specific weapon item
    await helpers.openItemDetail('Quicksilver Storm Auto Rifle');

    // Verify item popup opens with correct content
    await helpers.verifyItemPopupContent('Quicksilver Storm', 'Auto Rifle');

    // Verify item stats are displayed
    await expect(page.getByText('RPM')).toBeVisible();
    await expect(page.getByText('720')).toBeVisible(); // RPM value
    await expect(page.getByText('Enemies Defeated')).toBeVisible();
  });

  test('displays item perks and details in popup', async ({ page }) => {
    await helpers.openItemDetail('Quicksilver Storm Auto Rifle');

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
    await helpers.openItemDetail('Quicksilver Storm Auto Rifle');
    await helpers.verifyItemPopupActions();

    // Verify tag dropdown and add notes button
    await expect(page.getByRole('combobox').filter({ hasText: /tag item/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add notes/i })).toBeVisible();
  });

  test('displays character equip options in item popup', async ({ page }) => {
    await helpers.openItemDetail('Quicksilver Storm Auto Rifle');
    await helpers.verifyCharacterEquipOptions();

    // Current character button should be disabled
    await expect(page.getByRole('button', { name: /pull to.*hunter.*\[P\]/i })).toBeDisabled();
  });

  test('has multiple tabs in item popup', async ({ page }) => {
    await helpers.openItemDetail('Quicksilver Storm Auto Rifle');
    await helpers.verifyItemPopupTabs();

    // Test tab switching
    await helpers.switchToItemTab('Triage');
    await helpers.switchToItemTab('Overview');
  });

  test('can close item popup', async ({ page }) => {
    await helpers.openItemDetail('Quicksilver Storm Auto Rifle');
    await helpers.closeItemDetail();

    // Re-open and test closing by clicking outside
    await helpers.openItemDetail('Quicksilver Storm Auto Rifle');

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

    await helpers.verifyItemTypesVisible(weaponTypes);
  });

  test('shows armor items in armor section', async ({ page }) => {
    await helpers.verifyArmorSection();

    // Verify armor has power levels
    const armorSection = page.getByText('Armor').locator('..');
    const armorPowerPattern = /\d{4}/;
    await expect(armorSection.getByText(armorPowerPattern).first()).toBeVisible();
  });

  test('displays consumables and materials in general section', async ({ page }) => {
    // Verify general items section
    const generalSection = page.getByText('General').locator('..');
    await expect(generalSection).toBeVisible();

    // Check for the section structure
    await expect(page.getByRole('heading', { name: 'General' })).toBeVisible();
  });

  test('handles rapid item clicking gracefully', async ({ page }) => {
    // Rapidly click on different items to test stability
    const items = ['Quicksilver Storm Auto Rifle', 'Pizzicato-22 Submachine Gun'];

    for (const item of items) {
      if (await page.getByText(item).isVisible()) {
        await helpers.openItemDetail(item);
        await helpers.closeItemDetail();
      }
    }
  });

  test('displays item quality indicators', async ({ page }) => {
    // Thumbs up indicators for good rolls
    await expect(page.getByText('Thumbs Up').first()).toBeVisible();

    // Power level numbers should be visible throughout
    await expect(page.getByText(/^\d{4}$/).first()).toBeVisible();
  });
});
