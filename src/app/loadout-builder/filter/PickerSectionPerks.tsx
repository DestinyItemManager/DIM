import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import React from 'react';
import { LockedItemType, LockedPerk } from '../types';
import styles from './PickerSection.m.scss';
import { SelectablePerk } from './SelectableBungieImage';

/**
 * A list of selectable perks for a bucket (chest, helmet, etc) for use in PerkPicker.
 */
export default function PickerSectionPerks({
  bucket,
  defs,
  perks,
  lockedPerk,
  onPerkSelected,
}: {
  bucket: InventoryBucket;
  defs: D2ManifestDefinitions;
  perks: readonly PluggableInventoryItemDefinition[];
  lockedPerk?: LockedPerk;
  onPerkSelected(perk: LockedItemType);
}) {
  return (
    <div className={styles.bucket}>
      <div className={styles.header}>{bucket.name}</div>
      <div className={styles.items}>
        {perks.map((perk) => (
          <SelectablePerk
            key={perk.hash}
            defs={defs}
            bucket={bucket}
            selected={Boolean(lockedPerk && perk.hash === lockedPerk.perk.hash)}
            selectable={Boolean(!lockedPerk || perk.hash === lockedPerk.perk.hash)}
            perk={perk}
            onLockedPerk={onPerkSelected}
          />
        ))}
      </div>
    </div>
  );
}
