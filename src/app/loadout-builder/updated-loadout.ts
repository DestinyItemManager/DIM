import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { convertToLoadoutItem } from 'app/loadout-drawer/loadout-utils';
import { t } from 'i18next';
import _ from 'lodash';
import { ArmorSet, LockableBucketHashes } from './types';
import { statTier } from './utils';

/**
 * Create a new loadout from the original prototype loadout, but with the armor items replaced with this loadout's armor.
 * Used for equipping or creating a new saved loadout.
 */
export function updateLoadoutWithArmorSet(
  defs: D2ManifestDefinitions,
  originalLoadout: Loadout,
  set: ArmorSet,
  items: DimItem[],
  lockedMods: PluggableInventoryItemDefinition[]
): Loadout {
  const data = {
    tier: _.sumBy(Object.values(set.stats), statTier),
  };
  const existingItemsWithoutArmor = originalLoadout.items.filter(
    (li) =>
      !LockableBucketHashes.includes(
        defs.InventoryItem.get(li.hash)?.inventory?.bucketTypeHash ?? 0
      )
  );
  const loadoutItems = items.map((item) => convertToLoadoutItem(item, true));

  // We need to add in this set's specific stat mods (artifice, general) to the list of user-chosen mods
  // We can't start with the list of mods in the existing loadout parameters because lockedMods has filtered out
  // invalid mods, mods that don't fit, and general mods if we're auto-assigning general mods.
  const allMods = [...lockedMods.map((m) => m.hash), ...set.statMods];
  return {
    ...originalLoadout,
    parameters: {
      ...originalLoadout.parameters,
      mods: allMods.length ? allMods : undefined,
    },
    items: [...existingItemsWithoutArmor, ...loadoutItems],
    name: originalLoadout.name ?? t('Loadouts.Generated', data),
  };
}
