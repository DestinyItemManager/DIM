import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { moveItemTo } from 'app/inventory/move-item';
import { DimStore } from 'app/inventory/store-types';
import { findItemsByBucket } from 'app/inventory/stores-helpers';
import { showItemPicker } from 'app/item-picker/item-picker';
import { itemCategoryIcons } from 'app/organizer/item-category-icons';
import { ThunkDispatchProp } from 'app/store/types';
import { chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import clsx from 'clsx';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import pursuitsInfo from 'data/d2/pursuits.json';
import React from 'react';
import { useDispatch } from 'react-redux';
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
  const dispatch = useDispatch<ThunkDispatchProp['dispatch']>();

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

  const pullItemCategory = async (itemCategory: number) => {
    try {
      const { item } = await showItemPicker({
        filterItems: (item) =>
          item.itemCategoryHashes.includes(itemCategory) && itemCanBeEquippedBy(item, store),
        prompt: t('MovePopup.PullItem', {
          bucket: defs.ItemCategory.get(itemCategory).displayProperties.name,
          store: store.name,
        }),
      });

      await dispatch(moveItemTo(item, store));
    } catch (e) {}
  };

  type DefType = 'ActivityMode' | 'Place' | 'DamageType' | 'ItemCategory';

  const mapped: { [type in DefType]: { [key: number]: DimItem[] } } = {
    ActivityMode: {},
    Place: {},
    DamageType: {},
    ItemCategory: {},
  };
  for (const i of bounties) {
    const info = pursuitsInfo[i.hash];
    if (info) {
      for (const key in info) {
        for (const value of info[key]) {
          mapped[key][value] ||= [];
          mapped[key][value].push(i);
        }
      }
    }
  }

  const flattened: { type: DefType; value: number; bounties: DimItem[] }[] = Object.entries(
    mapped
  ).flatMap(([type, mapping]: [DefType, { [key: number]: DimItem[] }]) =>
    Object.entries(mapping).map(([value, bounties]) => ({
      type,
      value: parseInt(value, 10),
      bounties,
    }))
  );

  flattened.sort(
    chainComparator(
      compareBy((f) => f.type),
      reverseComparator(compareBy((f) => f.bounties.length))
    )
  );

  return (
    <div className={styles.guide}>
      {flattened.map(({ type, value, bounties }) => (
        <div
          key={type + value}
          className={clsx(styles.pill, { [styles.clickable]: type === 'ItemCategory' })}
          onClick={type === 'ItemCategory' ? () => pullItemCategory(value) : undefined}
        >
          {(() => {
            switch (type) {
              case 'ActivityMode':
                return (
                  <>
                    {defs.ActivityMode[value].displayProperties.hasIcon && (
                      <BungieImage
                        height="16"
                        src={defs.ActivityMode[value].displayProperties.icon}
                      />
                    )}
                    {defs.ActivityMode[value].displayProperties.name}
                  </>
                );
              case 'Place':
                return (
                  <>
                    {defs.Place.get(value).displayProperties.hasIcon && (
                      <BungieImage height="16" src={defs.Place.get(value).displayProperties.icon} />
                    )}
                    {defs.Place.get(value)?.displayProperties.name}
                  </>
                );
              case 'DamageType':
                return (
                  <>
                    {defs.DamageType.get(value).displayProperties.hasIcon && (
                      <BungieImage
                        height="16"
                        src={defs.DamageType.get(value).displayProperties.icon}
                      />
                    )}
                    {defs.DamageType.get(value)?.displayProperties.name}
                  </>
                );
              case 'ItemCategory':
                return (
                  <>
                    {itemCategoryIcons[value] && (
                      <img
                        className={styles.itemCategoryIcon}
                        height="16"
                        src={itemCategoryIcons[value]}
                      />
                    )}
                    {defs.ItemCategory.get(value)?.displayProperties.name}
                  </>
                );
            }
          })()}
          <span className={styles.count}>({bounties.length})</span>
        </div>
      ))}
    </div>
  );

  return null;
}
