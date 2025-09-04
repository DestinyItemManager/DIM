import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { convertToLoadoutItem } from 'app/loadout-drawer/loadout-utils';
import { Loadout } from 'app/loadout/loadout-types';
import { BucketHashes } from 'data/d2/generated-enums';
import { sum } from 'es-toolkit';
import { ArmorBucketHashes, ArmorSet } from './types';

/**
 * Create a new loadout from the original prototype loadout, but with the armor
 * items replaced with this loadout's armor. Used for equipping or creating a
 * new saved loadout.
 */
export function updateLoadoutWithArmorSet(
  defs: D2ManifestDefinitions,
  loadout: Loadout,
  set: ArmorSet,
  items: DimItem[],
  lockedMods: PluggableInventoryItemDefinition[],
  loadoutParameters = loadout.parameters,
): Loadout {
  const data = {
    statTotal: sum(Object.values(set.stats)),
  };

  const existingItemsWithoutArmor = loadout.items.filter(
    (li) =>
      // The new item might already be in the loadout (but unequipped), remove it
      !items.some((i) => i.id === li.id) &&
      // Remove equipped armor items
      !(
        li.equip &&
        ArmorBucketHashes.includes(defs.InventoryItem.get(li.hash)?.inventory?.bucketTypeHash ?? 0)
      ),
  );
  const loadoutItems = items.map((item) => convertToLoadoutItem(item, true));

  // We need to add in this set's specific stat mods (artifice, general) to the
  // list of user-chosen mods We can't start with the list of mods in the
  // existing loadout parameters because lockedMods has filtered out invalid
  // mods, mods that don't fit, and general mods if we're auto-assigning general
  // mods.
  const allMods = [...lockedMods.map((m) => m.hash), ...set.statMods];
  return {
    ...loadout,
    parameters: {
      ...loadoutParameters,
      mods: allMods.length ? allMods : undefined,
    },
    items: [...existingItemsWithoutArmor, ...loadoutItems],
    name: loadout.name ?? t('Loadouts.Generated', data),
  };
}

/**
 * Create a new loadout from an original prototype loadout, using mods and
 * subclass from another loadout, and the items from an armor set. Used for the
 * "compare loadout" drawer.
 */
export function mergeLoadout(
  defs: D2ManifestDefinitions,
  originalLoadout: Loadout,
  newLoadout: Loadout,
  set: ArmorSet,
  items: DimItem[],
  lockedMods: PluggableInventoryItemDefinition[],
): Loadout {
  const loadoutWithArmorSet = updateLoadoutWithArmorSet(
    defs,
    originalLoadout,
    set,
    items,
    lockedMods,
    newLoadout.parameters,
  );

  loadoutWithArmorSet.parameters = {
    ...newLoadout.parameters,
    mods: loadoutWithArmorSet.parameters?.mods,
  };

  const newSubclass = newLoadout.items.find(
    (li) => defs.InventoryItem.get(li.hash)?.inventory?.bucketTypeHash === BucketHashes.Subclass,
  );

  if (newSubclass) {
    const itemsWithoutSubclass = loadoutWithArmorSet.items.filter(
      (li) => defs.InventoryItem.get(li.hash)?.inventory?.bucketTypeHash !== BucketHashes.Subclass,
    );
    itemsWithoutSubclass.push(newSubclass);
    loadoutWithArmorSet.items = itemsWithoutSubclass;
  }

  return loadoutWithArmorSet;
}
