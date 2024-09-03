import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import BucketIcon from 'app/dim-ui/svgs/BucketIcon';
import { I18nKey, t, tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { moveItemTo } from 'app/inventory/move-item';
import { DimStore } from 'app/inventory/store-types';
import { useItemPicker } from 'app/item-picker/item-picker';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, addIcon } from 'app/shell/icons';
import { ThunkDispatchProp } from 'app/store/types';
import { chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import { LookupTable, isIn } from 'app/utils/util-types';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { TraitHashes } from 'data/d2/generated-enums';
import grenade from 'destiny-icons/weapons/grenade.svg';
import headshot from 'destiny-icons/weapons/headshot.svg';
import melee from 'destiny-icons/weapons/melee.svg';
import React from 'react';
import { useDispatch } from 'react-redux';
import styles from './BountyGuide.m.scss';
import { xpItems } from './xp';

const enum KillType {
  Melee,
  Super,
  Grenade,
  Finisher,
  Precision,
  ClassAbilities,
}
const killTypeIcons: LookupTable<KillType, string> = {
  [KillType.Melee]: melee,
  [KillType.Grenade]: grenade,
  [KillType.Precision]: headshot,
};

const killTypeDescriptions: Record<KillType, I18nKey> = {
  [KillType.Melee]: tl('KillType.Melee'),
  [KillType.Super]: tl('KillType.Super'),
  [KillType.Grenade]: tl('KillType.Grenade'),
  [KillType.Finisher]: tl('KillType.Finisher'),
  [KillType.Precision]: tl('KillType.Precision'),
  [KillType.ClassAbilities]: tl('KillType.ClassAbilities'),
};

export type DefType =
  | 'ActivityMode'
  | 'Destination'
  | 'DamageType'
  | 'ItemCategory'
  | 'KillType'
  | 'Reward'
  | 'QuestTrait';

const pursuitCategoryTraitHashes: TraitHashes[] = [
  TraitHashes.Seasonal_Quests,
  TraitHashes.TheFinalShape,
  TraitHashes.Exotics,
  TraitHashes.Playlists,
  TraitHashes.ThePast,
];

// Reward types we'll show in the bounty guide. Could be expanded (e.g. to seasonal mats)
const rewardAllowList = [
  ...Object.keys(xpItems).map((i) => parseInt(i, 10)),
  2817410917, // InventoryItem "Bright Dust"
  3168101969, // InventoryItem "Bright Dust"
];

export interface BountyFilter {
  type: DefType;
  hash: number;
}

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
  pursuitsInfo,
}: {
  store: DimStore;
  bounties: DimItem[];
  selectedFilters: BountyFilter[];
  onSelectedFiltersChanged: (filters: BountyFilter[]) => void;
  pursuitsInfo: { [hash: string]: { [type in DefType]?: number[] } };
}) {
  const defs = useD2Definitions()!;
  const dispatch = useDispatch<ThunkDispatchProp['dispatch']>();
  const showItemPicker = useItemPicker();

  const pullItemCategory = async (e: React.MouseEvent, itemCategory: number) => {
    e.stopPropagation();

    const bucket = defs.ItemCategory.get(itemCategory)?.displayProperties.name;
    const item = await showItemPicker({
      filterItems: (item) =>
        item.itemCategoryHashes.includes(itemCategory) && itemCanBeEquippedBy(item, store),
      prompt: t('MovePopup.PullItem', {
        bucket,
        store: store.name,
      }),
    });

    if (item) {
      await dispatch(moveItemTo(item, store));
    }
  };

  const mapped: { [type in DefType]: { [key: number]: DimItem[] } } = {
    ActivityMode: {},
    Destination: {},
    DamageType: {},
    ItemCategory: {},
    KillType: {},
    Reward: {},
    QuestTrait: {},
  };
  for (const i of bounties) {
    const expired = i.pursuit?.expiration
      ? i.pursuit.expiration.expirationDate.getTime() < Date.now()
      : false;
    if (!i.complete && !expired) {
      const info = pursuitsInfo[i.hash];
      if (info) {
        for (const key in info) {
          const infoKey = key as keyof typeof info;
          const values = info[infoKey];
          if (values) {
            for (const value of values) {
              (mapped[infoKey][value] ??= []).push(i);
            }
          }
        }
      }
      if (i.pursuit) {
        for (const reward of i.pursuit.rewards) {
          if (rewardAllowList.includes(reward.itemHash)) {
            (mapped.Reward[reward.itemHash] ??= []).push(i);
          }
        }
      }
      // Don't look up InventoryItem for "items" that were created from Records.
      if (!i.pursuit?.recordHash) {
        const traitHashes = defs.InventoryItem.get(i.hash)?.traitHashes;
        if (traitHashes) {
          for (const traitHash of traitHashes) {
            if (pursuitCategoryTraitHashes.includes(traitHash)) {
              (mapped.QuestTrait[traitHash] ??= []).push(i);
            }
          }
        }
      }
    }
  }

  const flattened = Object.entries(mapped).flatMap(([type, mapping]) =>
    Object.entries(mapping).map(([value, bounties]) => ({
      type: type as DefType,
      value: parseInt(value, 10),
      bounties,
    })),
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
      {flattened.map(({ type, value, bounties }) => (
        <button
          type="button"
          key={type + value}
          className={clsx(styles.pill, {
            [styles.selected]: matchPill(type, value, selectedFilters),
            // Show "synergy" when this category contains at least one bounty that overlaps with at least one of the selected filters
            [styles.synergy]:
              selectedFilters.length > 0 &&
              bounties.some((i) => matchBountyFilters(defs, i, selectedFilters, pursuitsInfo)),
          })}
          onClick={(e) => onClickPill(e, type, value)}
        >
          <PillContent defs={defs} type={type} value={value} />
          <span className={styles.count}>({bounties.length})</span>
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
        </button>
      ))}
    </div>
  );
}

function contentFromDisplayProperties(
  {
    displayProperties,
  }: {
    displayProperties: DestinyDisplayPropertiesDefinition;
  },
  hideIcon?: boolean,
) {
  return (
    <>
      {displayProperties.hasIcon && !hideIcon && (
        <BungieImage height="16" src={displayProperties.icon} />
      )}
      {displayProperties.name}
    </>
  );
}

function PillContent({
  type,
  defs,
  value,
}: {
  type: DefType;
  defs: D2ManifestDefinitions;
  value: number;
}) {
  switch (type) {
    case 'ActivityMode':
    case 'Destination':
    case 'DamageType':
      return contentFromDisplayProperties(defs[type].get(value));
    case 'ItemCategory':
      return (
        <>
          <BucketIcon itemCategoryHash={value} height="16" />
          {defs.ItemCategory.get(value)?.displayProperties.name}
        </>
      );
    case 'KillType':
      return (
        <>
          {isIn(value, killTypeIcons) && (
            <img className={styles.invert} height="16" src={killTypeIcons[value]} />
          )}
          {t(killTypeDescriptions[value as KillType])}
        </>
      );
    case 'Reward':
      return contentFromDisplayProperties(defs.InventoryItem.get(value));
    case 'QuestTrait':
      return contentFromDisplayProperties(
        defs.Trait.get(value),
        // the seasonal quest trait has the Season of the Lost icon?
        /* hideIcon */ value === TraitHashes.Seasonal_Quests,
      );
  }
}

function matchPill(type: DefType, hash: number, filters: BountyFilter[]) {
  return filters.some((f) => f.type === type && f.hash === hash);
}

/**
 * Returns true if the filter list is empty, or if the item matches *any* of the provided filters ("or").
 */
export function matchBountyFilters(
  defs: D2ManifestDefinitions,
  item: DimItem,
  filters: BountyFilter[],
  pursuitsInfo: { [hash: string]: { [type in DefType]?: number[] } },
) {
  if (filters.length === 0) {
    return true;
  }
  const info = pursuitsInfo[item.hash];
  for (const filter of filters) {
    if (filter.type === 'Reward') {
      return item.pursuit?.rewards.some((r) => r.itemHash === filter.hash);
    } else if (filter.type === 'QuestTrait') {
      return defs.InventoryItem.get(item.hash)?.traitHashes?.includes(filter.hash);
    } else if (info?.[filter.type]?.includes(filter.hash)) {
      return true;
    }
  }

  return false;
}
