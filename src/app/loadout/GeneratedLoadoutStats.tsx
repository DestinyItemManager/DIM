import React from 'react';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { SEASONAL_ARTIFACT_BUCKET } from 'app/search/d2-known-values';
import AppIcon from 'app/shell/icons/AppIcon';
import FractionalPowerLevel from 'app/dim-ui/FractionalPowerLevel';
import PressTip from 'app/dim-ui/PressTip';
import type { DimItem } from '../inventory/item-types';
import type { InventoryBuckets } from '../inventory/inventory-buckets';
import type { DimStore } from '../inventory/store-types';
import type { Loadout } from './loadout-types';
import { LoadoutStats } from 'app/store-stats/CharacterStats';
import { getArmorStats, getLight } from './loadout-utils';
import { powerActionIcon } from 'app/shell/icons';
import { getArtifactBonus } from 'app/inventory/stores-helpers';
import { maxLightItemSet } from './auto-loadouts';

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
    if (bucket.hash === SEASONAL_ARTIFACT_BUCKET) {
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
  defs,
  stores,
  buckets,
  items,
  loadout,
}: {
  defs: D1ManifestDefinitions | D2ManifestDefinitions;
  stores: DimStore[];
  buckets: InventoryBuckets;
  items: DimItem[];
  loadout: Loadout;
}) {
  if (defs.isDestiny1()) {
    // just D2, for now
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
    const maxPowerItems = maxLightItemSet(stores, subclass).unrestricted;
    const maxWeapons = _.compact(
      weaponItems.missingBuckets.map(
        (bucket) => maxPowerItems.find((item) => bucket.type === item.type)!
      )
    );
    weaponItems.itemSet.push(...maxWeapons);
  }

  // Compute stats and power level.
  const stats = getArmorStats(defs, armorItems.itemSet);
  const power =
    getLight(stores[0], weaponItems.itemSet.concat(armorItems.itemSet)) +
    getArtifactBonus(stores[0]);

  return (
    <div className="stat-bars destiny2">
      <div className="power">
        <PressTip tooltip={weaponItems.missingBuckets.length && t('Loadouts.AssumeMaxWeapons')}>
          <>
            <AppIcon icon={powerActionIcon} />
            <FractionalPowerLevel power={power} />
            {weaponItems.missingBuckets.length ? '*' : null}
          </>
        </PressTip>
      </div>
      <LoadoutStats stats={stats} />
    </div>
  );
}
