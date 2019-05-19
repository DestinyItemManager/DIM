import React from 'react';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { LockedItemType, BurnItem } from './types';
import SelectableBungieImage, { SelectableBurn } from './locked-armor/SelectableBungieImage';
import styles from './PerksForBucket.m.scss';

/**
 * A list of selectable perks for a bucket (chest, helmet, etc) for use in PerkPicker.
 */
export default function PerksForBucket({
  bucket,
  perks,
  burns,
  locked,
  filteredPerks,
  onPerkSelected
}: {
  bucket: InventoryBucket;
  perks: readonly DestinyInventoryItemDefinition[];
  burns: BurnItem[];
  locked?: readonly LockedItemType[];
  filteredPerks: ReadonlySet<DestinyInventoryItemDefinition>;
  onPerkSelected(perk: LockedItemType);
}) {
  return (
    <div className={styles.bucket}>
      <h3>{bucket.name}</h3>
      <div className={styles.perks}>
        {perks.map((perk) => (
          <SelectableBungieImage
            key={perk.hash}
            selected={Boolean(
              locked && locked.some((p) => p.type === 'perk' && p.perk.hash === perk.hash)
            )}
            unselectable={filteredPerks && !filteredPerks.has(perk)}
            perk={perk}
            onLockedPerk={onPerkSelected}
          />
        ))}

        {burns.map((burn) => (
          <SelectableBurn
            key={burn.dmg}
            burn={burn}
            selected={Boolean(
              locked && locked.some((p) => p.type === 'burn' && p.burn.dmg === burn.dmg)
            )}
            onLockedPerk={onPerkSelected}
          />
        ))}
      </div>
    </div>
  );
}
