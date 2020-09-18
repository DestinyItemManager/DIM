import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import React from 'react';
import { SelectablePerk } from '../locked-armor/SelectableBungieImage';
import { LockedItemType } from '../types';
import { getFilteredPerksAndPlugSets } from '../utils';
import styles from './PickerSection.m.scss';

/**
 * A list of selectable perks for a bucket (chest, helmet, etc) for use in PerkPicker.
 */
export default function PerksForBucket({
  bucket,
  defs,
  perks,
  locked,
  items,
  onPerkSelected,
}: {
  bucket: InventoryBucket;
  defs: D2ManifestDefinitions;
  perks: readonly PluggableInventoryItemDefinition[];
  locked: readonly LockedItemType[];
  items: readonly DimItem[];
  onPerkSelected(perk: LockedItemType);
}) {
  const filterInfo = getFilteredPerksAndPlugSets(locked, items);

  return (
    <div className={styles.bucket} id={`perk-bucket-${bucket.hash}`}>
      <div className={styles.header}>{bucket.name}</div>
      <div className={styles.items}>
        {perks.map((perk) => (
          <SelectablePerk
            key={perk.hash}
            defs={defs}
            bucket={bucket}
            selected={Boolean(locked?.some((p) => p.type === 'perk' && p.perk.hash === perk.hash))}
            unselectable={Boolean(filterInfo.filteredPerks && !filterInfo.filteredPerks.has(perk))}
            perk={perk}
            onLockedPerk={onPerkSelected}
          />
        ))}
      </div>
    </div>
  );
}
