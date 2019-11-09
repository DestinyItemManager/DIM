import React from 'react';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { LockedItemType, BurnItem } from './types';
import SelectableBungieImage, { SelectableBurn } from './locked-armor/SelectableBungieImage';
import styles from './PerksForBucket.m.scss';
import { DimItem } from 'app/inventory/item-types';
import { getFilteredPerks } from './generated-sets/utils';

/**
 * A list of selectable perks for a bucket (chest, helmet, etc) for use in PerkPicker.
 */
export default function PerksForBucket({
  bucket,
  perks,
  mods,
  burns,
  locked,
  items,
  onPerkSelected
}: {
  bucket: InventoryBucket;
  perks: readonly DestinyInventoryItemDefinition[];
  mods: readonly DestinyInventoryItemDefinition[];
  burns: BurnItem[];
  locked: readonly LockedItemType[];
  items: readonly DimItem[];
  onPerkSelected(perk: LockedItemType);
}) {
  // TODO: adapt to mods
  const filteredPerks = getFilteredPerks(locked, items);

  return (
    <div className={styles.bucket} id={`perk-bucket-${bucket.hash}`}>
      <h3>{bucket.name}</h3>
      <div className={styles.perks}>
        {mods.map((mod) => (
          /* TODO: mod overlay */
          /* TODO: perk description */
          <SelectableBungieImage
            key={mod.hash}
            bucket={bucket}
            selected={Boolean(
              locked && locked.some((p) => p.type === 'mod' && p.mod.hash === mod.hash)
            )}
            unselectable={Boolean(filteredPerks && !filteredPerks.has(mod))}
            perk={mod}
            onLockedPerk={onPerkSelected}
          />
        ))}

        {perks.map((perk) => (
          <SelectableBungieImage
            key={perk.hash}
            bucket={bucket}
            selected={Boolean(
              locked && locked.some((p) => p.type === 'perk' && p.perk.hash === perk.hash)
            )}
            unselectable={Boolean(filteredPerks && !filteredPerks.has(perk))}
            perk={perk}
            onLockedPerk={onPerkSelected}
          />
        ))}

        {burns.map((burn) => (
          <SelectableBurn
            key={burn.dmg}
            bucket={bucket}
            burn={burn}
            selected={Boolean(
              locked && locked.some((p) => p.type === 'burn' && p.burn.dmg === burn.dmg)
            )}
            unselectable={Boolean(
              locked && locked.some((p) => p.type === 'burn' && p.burn.dmg !== burn.dmg)
            )}
            onLockedPerk={onPerkSelected}
          />
        ))}
      </div>
    </div>
  );
}
