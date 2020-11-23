import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { moveItemTo } from 'app/inventory/move-item';
import { DimStore } from 'app/inventory/store-types';
import { showItemPicker } from 'app/item-picker/item-picker';
import { itemCategoryIcons } from 'app/organizer/item-category-icons';
import { ThunkDispatchProp } from 'app/store/types';
import { chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import clsx from 'clsx';
import pursuitsInfo from 'data/d2/pursuits.json';
import grenade from 'destiny-icons/weapons/grenade.svg';
import headshot from 'destiny-icons/weapons/headshot.svg';
import melee from 'destiny-icons/weapons/melee.svg';
import React from 'react';
import { useDispatch } from 'react-redux';
import styles from './BountyGuide.m.scss';

enum KillType {
  Melee,
  Super,
  Grenade,
  Finisher,
  Precision,
  ClassAbilities,
}
const killTypeIcons: { [key in KillType]: string | undefined } = {
  [KillType.Melee]: melee,
  [KillType.Super]: undefined,
  [KillType.Grenade]: grenade,
  [KillType.Finisher]: undefined,
  [KillType.Precision]: headshot,
  [KillType.ClassAbilities]: undefined,
} as const;

type DefType = 'ActivityMode' | 'Destination' | 'DamageType' | 'ItemCategory' | 'KillType';

/**
 * This provides a little visual guide to what bounties you have - specifically, what weapons/activities/locations are required for your bounties.
 *
 * This is meant to be usable in both the Progress page and Active Mode.
 */
export default function BountyGuide({
  store,
  bounties,
  defs,
}: {
  store: DimStore;
  bounties: DimItem[];
  defs: D2ManifestDefinitions;
}) {
  const dispatch = useDispatch<ThunkDispatchProp['dispatch']>();

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

  const mapped: { [type in DefType]: { [key: number]: DimItem[] } } = {
    ActivityMode: {},
    Destination: {},
    DamageType: {},
    ItemCategory: {},
    KillType: {},
  };
  for (const i of bounties) {
    if (!i.complete) {
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

  if (flattened.length === 0) {
    return null;
  }

  flattened.sort(
    chainComparator(
      // compareBy((f) => f.type),
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
              case 'Destination':
                return (
                  <>
                    {defs.Destination.get(value).displayProperties.hasIcon && (
                      <BungieImage
                        height="16"
                        src={defs.Destination.get(value).displayProperties.icon}
                      />
                    )}
                    {defs.Destination.get(value)?.displayProperties.name}
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
              case 'KillType':
                return (
                  <>
                    {killTypeIcons[value] && (
                      <img
                        className={styles.itemCategoryIcon}
                        height="16"
                        src={killTypeIcons[value]}
                      />
                    )}
                    {KillType[value]}
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
