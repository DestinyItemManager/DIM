import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { moveItemTo } from 'app/inventory/move-item';
import { DimStore } from 'app/inventory/store-types';
import { showItemPicker } from 'app/item-picker/item-picker';
import { useD2Definitions } from 'app/manifest/selectors';
import { itemCategoryIcons } from 'app/organizer/item-category-icons';
import { useSetting } from 'app/settings/hooks';
import { addIcon, AppIcon } from 'app/shell/icons';
import { ThunkDispatchProp } from 'app/store/types';
import { chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import clsx from 'clsx';
import pursuitsInfoFile from 'data/d2/pursuits.json';
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

export type DefType = 'ActivityMode' | 'Destination' | 'DamageType' | 'ItemCategory' | 'KillType';

export type BountyFilter = {
  type: DefType;
  hash: number;
};

/**
 * This provides a little visual guide to what bounties you have - specifically, what weapons/activities/locations are required for your bounties.
 *
 * This is meant to be usable in both the Progress page and Active Mode.
 */
export default function BountyGuide({
  store,
  bounties,
  selectedFilters,
  onSelectedFiltersChanged,
  skipTypes,
  pursuitsInfo = pursuitsInfoFile,
}: {
  store: DimStore;
  bounties: DimItem[];
  selectedFilters: BountyFilter[];
  onSelectedFiltersChanged(filters: BountyFilter[]): void;
  skipTypes?: DefType[]; // Filter to show only specific bounty types
  pursuitsInfo?: { [hash: string]: { [type in DefType]?: number[] } };
}) {
  const defs = useD2Definitions()!;
  const dispatch = useDispatch<ThunkDispatchProp['dispatch']>();
  const [showCompletedBountiesCount] = useSetting('progressBountiesCompletedCountShow');

  const pullItemCategory = async (e: React.MouseEvent, itemCategory: number) => {
    e.stopPropagation();
    try {
      const bucket = defs.ItemCategory.get(itemCategory)?.displayProperties.name;
      const { item } = await showItemPicker({
        filterItems: (item) =>
          item.itemCategoryHashes.includes(itemCategory) && itemCanBeEquippedBy(item, store),
        prompt: t('MovePopup.PullItem', {
          bucket,
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
    const expired = i.pursuit?.expirationDate
      ? i.pursuit.expirationDate.getTime() < Date.now()
      : false;
    if (showCompletedBountiesCount ? !expired || i.complete : !expired && !i.complete) {
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

  const flattened: { type: DefType; value: number; bounties: DimItem[]; completes: DimItem[] }[] =
    Object.entries(mapped).flatMap(([type, mapping]: [DefType, { [key: number]: DimItem[] }]) =>
      Object.entries(mapping).map(([value, bounties]) => ({
        type,
        value: parseInt(value, 10),
        bounties: showCompletedBountiesCount ? bounties.filter((item) => !item.complete) : bounties,
        completes: showCompletedBountiesCount ? bounties.filter((item) => item.complete) : [],
      }))
    );

  if (flattened.length === 0) {
    return null;
  }

  flattened.sort(chainComparator(reverseComparator(compareBy((f) => f.bounties.length))));

  const onClickPill = (e: React.MouseEvent, type: DefType, value: number) => {
    e.stopPropagation();
    const match = (f: BountyFilter) => f.type === type && f.hash === value;
    if (e.shiftKey) {
      const existing = selectedFilters.find(match);
      if (existing) {
        onSelectedFiltersChanged(selectedFilters.filter((f) => !match(f)));
      } else {
        onSelectedFiltersChanged([...selectedFilters, { type, hash: value }]);
      }
    } else if (selectedFilters.length > 1 || !selectedFilters.some(match)) {
      onSelectedFiltersChanged([{ type, hash: value }]);
    } else {
      onSelectedFiltersChanged([]);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectedFiltersChanged([]);
  };

  return (
    <div className={styles.guide} onClick={clearSelection}>
      {flattened.map(
        ({ type, value, bounties, completes }) =>
          !skipTypes?.includes(type) && (
            <div
              key={type + value}
              className={clsx(styles.pill, {
                [styles.selected]: matchPill(type, value, selectedFilters),
                // Show "synergy" when this category contains at least one bounty that overlaps with at least one of the selected filters
                [styles.synergy]:
                  selectedFilters.length > 0 &&
                  bounties.some((i) => matchBountyFilters(i, selectedFilters, pursuitsInfo)),
              })}
              onClick={(e) => onClickPill(e, type, value)}
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
              {showCompletedBountiesCount && (
                <span className={styles.count}>({completes.length})</span>
              )}
              {type === 'ItemCategory' && (
                <span
                  className={styles.pullItem}
                  onClick={(e) => {
                    pullItemCategory(e, value);
                  }}
                >
                  <AppIcon icon={addIcon} />
                </span>
              )}
            </div>
          )
      )}
    </div>
  );
}

function matchPill(type: DefType, hash: number, filters: BountyFilter[]) {
  return filters.some((f) => f.type === type && f.hash === hash);
}

/**
 * Returns true if the filter list is empty, or if the item matches *any* of the provided filters ("or").
 */
export function matchBountyFilters(
  item: DimItem,
  filters: BountyFilter[],
  pursuitsInfo: { [hash: string]: { [type in DefType]?: number[] } } = pursuitsInfoFile
) {
  if (filters.length === 0) {
    return true;
  }
  const info = pursuitsInfo[item.hash];
  if (info) {
    for (const filter of filters) {
      if (info[filter.type]?.includes(filter.hash)) {
        return true;
      }
    }
  }
  return false;
}
