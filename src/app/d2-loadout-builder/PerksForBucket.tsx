import React from 'react';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { LockedItemType, BurnItem } from './types';
import SelectableBungieImage from './locked-armor/popup/SelectableBungieImage';
import SelectableBurn from './locked-armor/popup/SelectableBurn';
import { t } from 'app/i18next-t';
import styles from './PerksForBucket.m.scss';

const burns: BurnItem[] = [
  {
    index: 'arc',
    displayProperties: {
      name: t('LoadoutBuilder.BurnTypeArc'),
      icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/arc.png'
    }
  },
  {
    index: 'solar',
    displayProperties: {
      name: t('LoadoutBuilder.BurnTypeSolar'),
      icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/thermal.png'
    }
  },
  {
    index: 'void',
    displayProperties: {
      name: t('LoadoutBuilder.BurnTypeVoid'),
      icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/void.png'
    }
  }
];

/**
 * A list of selectable perks for a bucket (chest, helmet, etc) for use in PerkPicker.
 */
export default function PerksForBucket({
  bucket,
  perks,
  locked,
  filteredPerks,
  onPerkSelected
}: {
  bucket: InventoryBucket;
  perks: DestinyInventoryItemDefinition[];
  locked?: readonly LockedItemType[];
  filteredPerks: ReadonlySet<DestinyInventoryItemDefinition>;
  onPerkSelected(perk: DestinyInventoryItemDefinition);
}) {
  return (
    <div key={bucket.hash} className={styles.bucket}>
      <h3>{bucket.name}</h3>
      <div className={styles.perks}>
        {perks.map((perk) => (
          <SelectableBungieImage
            key={perk.hash}
            selected={Boolean(locked && locked.some((p) => p.item.index === perk.index))}
            unselectable={filteredPerks && !filteredPerks.has(perk)}
            perk={perk}
            onLockedPerk={onPerkSelected}
            onHoveredPerk={(...args) => console.log('onHoveredPerk', args)}
          />
        ))}

        {burns.map((burn) => (
          <SelectableBurn
            key={burn.index}
            burn={burn}
            selected={Boolean(locked && locked.some((p) => p.item.index === burn.index))}
            onLockedPerk={onPerkSelected}
            onHoveredPerk={(...args) => console.log('onHoveredPerk', args)}
          />
        ))}
      </div>
    </div>
  );
}
