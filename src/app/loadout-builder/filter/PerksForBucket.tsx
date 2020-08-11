import React from 'react';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { LockedItemType, BurnItem } from '../types';
import {
  SelectableBurn,
  SelectablePerk,
  SelectableMod,
} from '../locked-armor/SelectableBungieImage';
import styles from './PerksForBucket.m.scss';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { getFilteredPerksAndPlugSets } from '../utils';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';

/**
 * A list of selectable perks for a bucket (chest, helmet, etc) for use in PerkPicker.
 */
export default function PerksForBucket({
  bucket,
  defs,
  perks,
  mods,
  burns,
  locked,
  items,
  onPerkSelected,
}: {
  bucket: InventoryBucket;
  defs: D2ManifestDefinitions;
  perks: readonly PluggableInventoryItemDefinition[];
  mods: readonly {
    item: PluggableInventoryItemDefinition;
    // plugSet this mod appears in
    plugSetHash: number;
  }[];
  burns: BurnItem[];
  locked: readonly LockedItemType[];
  items: readonly DimItem[];
  onPerkSelected(perk: LockedItemType);
}) {
  const filterInfo = getFilteredPerksAndPlugSets(locked, items);

  return (
    <div className={styles.bucket} id={`perk-bucket-${bucket.hash}`}>
      <h3>{bucket.name}</h3>
      <div className={styles.perks}>
        {mods.map((mod) => (
          <SelectableMod
            key={mod.item.hash}
            defs={defs}
            bucket={bucket}
            selected={Boolean(
              locked?.some((p) => p.type === 'mod' && p.mod.hash === mod.item.hash)
            )}
            unselectable={Boolean(
              filterInfo.filteredPlugSetHashes &&
                !filterInfo.filteredPlugSetHashes.has(mod.plugSetHash)
            )}
            mod={mod.item}
            plugSetHash={mod.plugSetHash}
            onLockedPerk={onPerkSelected}
          />
        ))}

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

        {burns.map((burn) => (
          <SelectableBurn
            key={burn.dmg}
            bucket={bucket}
            burn={burn}
            selected={Boolean(locked?.some((p) => p.type === 'burn' && p.burn.dmg === burn.dmg))}
            unselectable={Boolean(
              locked?.some((p) => p.type === 'burn' && p.burn.dmg !== burn.dmg)
            )}
            onLockedPerk={onPerkSelected}
          />
        ))}
      </div>
    </div>
  );
}
