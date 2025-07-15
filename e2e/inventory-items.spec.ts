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
    // Click on a specific weapon item we know exists from the snapshot
    const weaponItem = page
      .getByText('Quicksilver Storm Auto Rifle')
      .or(page.getByText('Pizzicato-22 Submachine Gun'))
      .or(page.getByText('The Call Sidearm'))
      .first();
    await weaponItem.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await helpers.verifyItemPopupActions();

    // Verify tag dropdown and add notes button
    await expect(page.getByRole('combobox').filter({ hasText: /tag item/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add notes/i })).toBeVisible();
  });

  test('displays character equip options in item popup', async ({ page }) => {
    // Click on a specific weapon item we know exists from the snapshot
    const weaponItem = page
      .getByText('Quicksilver Storm Auto Rifle')
      .or(page.getByText('Pizzicato-22 Submachine Gun'))
      .or(page.getByText('The Call Sidearm'))
      .first();
    await weaponItem.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await helpers.verifyCharacterEquipOptions();

    // Some character button should be disabled (active character)
    await expect(
      page.getByRole('button', { disabled: true }).filter({ hasText: /pull to/i }),
    ).toBeVisible();
  });

  test('has multiple tabs in item popup', async ({ page }) => {
    // Click on a specific weapon item we know exists from the snapshot
    const weaponItem = page
      .getByText('Quicksilver Storm Auto Rifle')
      .or(page.getByText('Pizzicato-22 Submachine Gun'))
      .or(page.getByText('The Call Sidearm'))
      .first();
    await weaponItem.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await helpers.verifyItemPopupTabs();

    // Test tab switching
    await helpers.switchToItemTab('Triage');
    await helpers.switchToItemTab('Overview');
  });

  test('can close item popup', async ({ page }) => {
    // Click on a specific weapon item we know exists from the snapshot
    const weaponItem = page
      .getByText('Quicksilver Storm Auto Rifle')
      .or(page.getByText('Pizzicato-22 Submachine Gun'))
      .or(page.getByText('The Call Sidearm'))
      .first();
    await weaponItem.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await helpers.closeItemDetail();

    // Re-open and test closing by clicking outside
    const weaponItem2 = page
      .getByText('Quicksilver Storm Auto Rifle')
      .or(page.getByText('Pizzicato-22 Submachine Gun'))
      .first();
    await weaponItem2.click();
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

    await helpers.verifyItemTypesVisible(weaponTypes);
  });

  test('shows armor items in armor section', async ({ page }) => {
    await helpers.verifyArmorSection();

    // Verify specific armor slot labels are visible
    await expect(page.getByText('Helmet')).toBeVisible();
    await expect(page.getByText('Chest Armor')).toBeVisible();
    await expect(page.getByText('Leg Armor')).toBeVisible();

    // Check that armor section is properly structured
    await expect(page.getByRole('heading', { name: 'Armor' })).toBeVisible();

    // Verify the armor section is expanded
    await expect(page.getByRole('button', { name: 'Armor' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
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
        await page.getByText(item).first().click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).not.toBeVisible();
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
