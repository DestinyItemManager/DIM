import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { BucketHashes } from 'data/d2/generated-enums';
import { getTestStores } from 'testing/test-utils';
import { buildItemActionsModel, ItemActionsModel } from './item-popup-actions';

/*
 * Tests for the item actions model. If we ever have bugs where the wrong buttons are showing / not showing, add a test here.
 */

let stores: DimStore[];
beforeAll(async () => {
  stores = await getTestStores();
  expect(stores).toBeDefined();
});

/** This is a bit janky - it pulls items out of the example profile based on a predicate */
function getTestActions(itemPredicate: (item: DimItem) => boolean): [DimItem, ItemActionsModel] {
  const item = stores.flatMap((s) => s.items).find(itemPredicate)!;
  expect(item).toBeDefined();

  const actions = buildItemActionsModel(item, stores);

  return [item, actions];
}

it('handles an equipped item', async () => {
  // Grab the equipped kinetic weapon
  const [_item, actions] = getTestActions(
    (i) => i.equipped && i.location.hash === BucketHashes.KineticWeapons,
  );

  expect(actions.hasMoveControls).toBe(true);
  expect(actions.hasControls).toBe(true);
  expect(actions.hasAccessoryControls).toBe(true);

  expect(actions.equip.length).toBe(3);
  expect(actions.equip[0].enabled).toBe(false);
  expect(actions.equip[1].enabled).toBe(true);
  expect(actions.equip[2].enabled).toBe(true);

  expect(actions.store.length).toBe(3);
  expect(actions.store[0].enabled).toBe(true);
  expect(actions.store[1].enabled).toBe(true);
  expect(actions.store[2].enabled).toBe(true);

  expect(actions.canVault).toBe(true);

  expect(actions.inPostmaster).toBe(false);

  expect(actions.taggable).toBe(true);
  expect(actions.lockable).toBe(true);
  expect(actions.infusable).toBe(true);
  expect(actions.comparable).toBe(true);
  expect(actions.loadoutable).toBe(true);
});
