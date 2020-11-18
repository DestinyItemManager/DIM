import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import { DimStore } from 'app/inventory/store-types';
import { findItemsByBucket } from 'app/inventory/stores-helpers';
import { itemCategoryIcons } from 'app/organizer/item-category-icons';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import pursuitsInfo from 'data/d2/pursuits.json';
import React from 'react';
import styles from './BountyGuide.m.scss';

/**
 * This provides a little visual guide to what bounties you have - specifically, what weapons/activities/locations are required for your bounties.
 *
 * This is meant to be usable in both the Progress page and Active Mode.
 */
export default function BountyGuide({
  store,
  defs,
}: {
  store: DimStore;
  defs: D2ManifestDefinitions;
}) {
  // We only care about bounties - longer-term quests are filtered out.
  const bounties = findItemsByBucket(store, BucketHashes.Quests).filter((item) => {
    const itemDef = defs.InventoryItem.get(item.hash);
    if (
      item.itemCategoryHashes.includes(ItemCategoryHashes.QuestStep) ||
      itemDef?.objectives?.questlineItemHash
    ) {
      return false;
    }
    if (!item.objectives || item.objectives.length === 0 || item.sockets) {
      return false;
    }

    return true;
  });

  const mapped = {};
  const annotated = bounties.map((i) => {
    const info = pursuitsInfo[i.hash];
    if (info) {
      for (const key in info) {
        for (const value of info[key]) {
          mapped[key] ||= {};
          mapped[key][value] ||= [];
          mapped[key][value].push(i);
        }
      }
    }
    return info;
  });

  console.log(annotated, mapped);

  return (
    <div className={styles.guide}>
      {Object.entries(mapped).map(([type, mapping]) =>
        Object.entries(mapping).map(([value, bounties]) => (
          <div key={type + value} className={styles.pill}>
            {(() => {
              switch (type) {
                case 'ActivityMode':
                  return (
                    <>
                      <BungieImage
                        height="16"
                        src={defs.ActivityMode[value].displayProperties.icon}
                      />{' '}
                      {defs.ActivityMode[value].displayProperties.name} ({bounties.length})
                    </>
                  );
                case 'Place':
                  return (
                    <>
                      <BungieImage height="16" src={defs.Place.get(value).displayProperties.icon} />
                      {defs.Place.get(value)?.displayProperties.name} ({bounties.length})
                    </>
                  );
                case 'DamageType':
                  return (
                    <>
                      <BungieImage
                        height="16"
                        src={defs.DamageType.get(value).displayProperties.icon}
                      />{' '}
                      {defs.DamageType.get(value)?.displayProperties.name} ({bounties.length})
                    </>
                  );
                case 'ItemCategory':
                  return (
                    <>
                      <img
                        className={styles.itemCategoryIcon}
                        height="16"
                        src={itemCategoryIcons[value]}
                      />{' '}
                      {defs.ItemCategory.get(value)?.displayProperties.name} ({bounties.length})
                    </>
                  );
              }
            })()}
          </div>
        ))
      )}
    </div>
  );

  return null;
}
