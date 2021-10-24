import PressTip from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { getArtifactBonus } from 'app/inventory/stores-helpers';
import { useD2Definitions } from 'app/manifest/selectors';
import { powerActionIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { LoadoutStats } from 'app/store-stats/CharacterStats';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';
import type { InventoryBuckets } from '../inventory/inventory-buckets';
import type { DimItem } from '../inventory/item-types';
import type { DimStore } from '../inventory/store-types';
import { maxLightItemSet } from './auto-loadouts';
import type { Loadout } from './loadout-types';
import { getArmorStats, getLight } from './loadout-utils';

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
  stores,
  allItems,
  buckets,
  items,
  loadout,
}: {
  stores: DimStore[];
  allItems: DimItem[];
  buckets: InventoryBuckets;
  items: DimItem[];
  loadout: Loadout;
}) {
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
    const subclass = stores.find((store) => store.classType === loadout.classType) ?? stores[0];
    const maxPowerItems = maxLightItemSet(allItems, subclass).unrestricted;
    const maxWeapons = _.compact(
      weaponItems.missingBuckets.map(
        (bucket) => maxPowerItems.find((item) => bucket.type === item.type)!
      )
    );
    weaponItems.itemSet.push(...maxWeapons);
  }

  // Compute stats and power level.
  const stats = getArmorStats(defs, armorItems.itemSet);
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
