import PressTip from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { allItemsSelector, bucketsSelector, storesSelector } from 'app/inventory/selectors';
import { getArtifactBonus } from 'app/inventory/stores-helpers';
import { useD2Definitions } from 'app/manifest/selectors';
import { powerActionIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { LoadoutStats } from 'app/store-stats/CharacterStats';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import type { InventoryBuckets } from '../inventory/inventory-buckets';
import type { DimItem, PluggableInventoryItemDefinition } from '../inventory/item-types';
import { maxLightItemSet } from './auto-loadouts';
import type { DimLoadoutItem, Loadout } from './loadout-types';
import { getLight, getLoadoutStats } from './loadout-utils';

function getItemsInListByCategory({
  buckets,
  category,
  items,
}: {
  buckets: InventoryBuckets;
  category: string;
  items: DimItem[];
}) {
  const itemSet: DimItem[] = [];
  const categoryBuckets = buckets.byCategory[category];
  const missingBuckets = categoryBuckets.filter((bucket) => {
    if (bucket.hash === BucketHashes.SeasonalArtifact) {
      return;
    }
    const item = items.find((item) => bucket.type === item.type);
    if (item) {
      if (!item.stats) {
        return;
      }
      itemSet.push(item);
    }

    return !item;
  });

  return { itemSet, missingBuckets };
}

export function GeneratedLoadoutStats({
  items,
  loadout,
  savedMods,
}: {
  items: DimLoadoutItem[];
  loadout: Loadout;
  savedMods: PluggableInventoryItemDefinition[];
}) {
  const allItems = useSelector(allItemsSelector);
  const stores = useSelector(storesSelector);
  const buckets = useSelector(bucketsSelector)!;

  // just D2, for now
  const defs = useD2Definitions();
  if (!defs) {
    return null;
  }

  const armorItems = getItemsInListByCategory({ buckets, category: 'Armor', items });
  if (armorItems.missingBuckets.length) {
    // If any armor types are missing, don't compute stats or power levels.
    return null;
  }

  const weaponItems = getItemsInListByCategory({ buckets, category: 'Weapons', items });
  if (weaponItems.missingBuckets) {
    // If any weapon types are missing, fill them in with max weapons to assume light level
    const characterClass =
      stores.find((store) => store.classType === loadout.classType) ?? stores[0];
    const maxPowerItems = maxLightItemSet(allItems, characterClass).unrestricted;
    const maxWeapons = _.compact(
      weaponItems.missingBuckets.map(
        (bucket) => maxPowerItems.find((item) => bucket.type === item.type)!
      )
    );
    weaponItems.itemSet.push(...maxWeapons);
  }

  const equippedSubclass = items.find(
    (item) =>
      item.equipped &&
      item.bucket.hash === BucketHashes.Subclass &&
      // TODO (ryan) this should probably be based off the selected store for loadouts
      // that span multiple characters.
      item.classType === loadout.classType
  );

  // Compute stats and power level.
  const stats = getLoadoutStats(
    defs,
    loadout.classType,
    equippedSubclass,
    armorItems.itemSet,
    savedMods
  );
  const power = Math.floor(
    getLight(stores[0], weaponItems.itemSet.concat(armorItems.itemSet)) +
      getArtifactBonus(stores[0])
  );

  return (
    <div className="stat-bars destiny2">
      <div className="power">
        <PressTip tooltip={weaponItems.missingBuckets.length && t('Loadouts.AssumeMaxWeapons')}>
          <>
            <AppIcon icon={powerActionIcon} />
            <span>{power}</span>
            {weaponItems.missingBuckets.length ? '*' : null}
          </>
        </PressTip>
      </div>
      <LoadoutStats stats={stats} characterClass={loadout.classType} />
    </div>
  );
}
