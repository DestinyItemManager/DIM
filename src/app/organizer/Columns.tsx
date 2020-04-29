/* eslint-disable react/jsx-key, react/prop-types */
import React from 'react';
import { DimItem, DimPlug } from 'app/inventory/item-types';
import BungieImage from 'app/dim-ui/BungieImage';
import {
  AppIcon,
  powerIndicatorIcon,
  lockIcon,
  thumbsUpIcon,
  thumbsDownIcon,
  faCheck
} from 'app/shell/icons';
import styles from './ItemTable.m.scss';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import _ from 'lodash';
import { getTag, getNotes, tagConfig, ItemInfos } from 'app/inventory/dim-item-info';
import TagIcon from 'app/inventory/TagIcon';
import { source } from 'app/inventory/spreadsheets';
import ElementIcon from 'app/inventory/ElementIcon';
import { D2SeasonInfo } from 'app/inventory/d2-season-info';
import { D2EventInfo } from 'data/d2/d2-event-info';
import { getRating } from 'app/item-review/reducer';
import { statWhiteList } from 'app/inventory/store/stats';
import { compareBy } from 'app/utils/comparators';
import RatingIcon from 'app/inventory/RatingIcon';
import { getItemSpecialtyModSlotDisplayName, getItemDamageShortName } from 'app/utils/item-utils';
import SpecialtyModSlotIcon from 'app/dim-ui/SpecialtyModSlotIcon';
import { DestinyCollectibleState } from 'bungie-api-ts/destiny2';
import { StatInfo } from 'app/compare/Compare';
import { filterPlugs } from 'app/loadout-builder/generated-sets/utils';
import PressTip from 'app/dim-ui/PressTip';
import PlugTooltip from 'app/item-popup/PlugTooltip';
import { INTRINSIC_PLUG_CATEGORY } from 'app/inventory/store/sockets';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DtrRating } from 'app/item-review/dtr-api-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { ColumnDefinition, SortDirection, ColumnGroup } from './table-types';
import { TagValue } from '@destinyitemmanager/dim-api-types';
import clsx from 'clsx';
import { statHashByName } from 'app/search/search-filter-hashes';
import { StatTotalToggle } from 'app/dim-ui/CustomStatTotal';
import { Loadout } from 'app/loadout/loadout-types';

/**
 * Get the ID used to select whether this column is shown or not.
 */
export function getColumnSelectionId(column: ColumnDefinition) {
  return column.columnGroup ? column.columnGroup.id : column.id;
}

// TODO: just default booleans to this
const booleanCell = (value) => (value ? <AppIcon icon={faCheck} /> : undefined);

const modSocketCategories = [2685412949, 590099826];

/**
 * This function generates the columns.
 */
export function getColumns(
  items: DimItem[],
  defs: D2ManifestDefinitions,
  itemInfos: ItemInfos,
  ratings: { [key: string]: DtrRating },
  wishList: {
    [key: string]: InventoryWishListRoll;
  },
  customTotalStat: number[],
  loadouts: Loadout[]
): ColumnDefinition[] {
  const hasWishList = !_.isEmpty(wishList);

  // TODO: most of these are constant and can be hoisted?
  // TODO: localize headers

  const statHashes: {
    [statHash: number]: StatInfo;
  } = {};
  for (const item of items) {
    if (item.stats) {
      for (const stat of item.stats) {
        if (statHashes[stat.statHash]) {
          statHashes[stat.statHash].max = Math.max(statHashes[stat.statHash].max, stat.value);
          statHashes[stat.statHash].min = Math.min(statHashes[stat.statHash].min, stat.value);
        } else {
          statHashes[stat.statHash] = {
            id: stat.statHash,
            displayProperties: stat.displayProperties,
            min: stat.value,
            max: stat.value,
            enabled: true,
            lowerBetter: stat.smallerIsBetter,
            getStat(item) {
              return item.stats ? item.stats.find((s) => s.statHash === stat.statHash) : undefined;
            }
          };
        }
      }
    }
  }

  const statsGroup: ColumnGroup = {
    id: 'stats',
    header: 'Stats'
  };
  const baseStatsGroup: ColumnGroup = {
    id: 'baseStats',
    header: 'Base Stats'
  };

  type ColumnWithStat = ColumnDefinition & { statHash: number };
  const statColumns: ColumnWithStat[] = _.sortBy(
    _.map(
      statHashes,
      (statInfo, statHashStr): ColumnWithStat => {
        const statHash = parseInt(statHashStr, 10);
        return {
          id: `stat_${statHash}`,
          header: statInfo.displayProperties.hasIcon ? (
            <BungieImage src={statInfo.displayProperties.icon} />
          ) : (
            statInfo.displayProperties.name
          ),
          statHash,
          columnGroup: statsGroup,
          value: (item: DimItem) => item.stats?.find((s) => s.statHash === statHash)?.value,
          defaultSort: statInfo.lowerBetter ? SortDirection.DESC : SortDirection.ASC,
          filter: (value) => `stat:${_.invert(statHashByName)[statHash]}:>=${value}`
        };
      }
    ),
    (s) => statWhiteList.indexOf(s.statHash)
  );

  const baseStatColumns: ColumnWithStat[] = statColumns.map((column) => ({
    ...column,
    id: `base_${column.statHash}`,
    columnGroup: baseStatsGroup,
    value: (item: DimItem) => item.stats?.find((s) => s.statHash === column.statHash)?.base,
    filter: (value) => `basestat:${_.invert(statHashByName)[column.statHash]}:>=${value}`
  }));

  const columns: ColumnDefinition[] = _.compact([
    {
      id: 'icon',
      header: 'Icon',
      value: (i) => i.icon,
      cell: (value: string, item) => (
        <ItemPopupTrigger item={item}>
          {(ref, onClick) => (
            <div ref={ref} onClick={onClick}>
              <BungieImage src={value} />
            </div>
          )}
        </ItemPopupTrigger>
      ),
      noSort: true,
      noHide: true
    },
    {
      id: 'name',
      header: 'Name',
      value: (i) => i.name,
      filter: (name) => `name:"${name}"`
    },
    {
      id: 'power',
      header: <AppIcon icon={powerIndicatorIcon} />,
      value: (item) => item.primStat?.value,
      defaultSort: SortDirection.DESC,
      filter: (value) => `power:>=${value}`
    },
    {
      id: 'dmg',
      header: items[0]?.bucket.inArmor ? 'Element' : 'Damage',
      value: (item) => item.element?.displayProperties.name,
      cell: (_, item) => <ElementIcon className={styles.inlineIcon} element={item.element} />,
      filter: (_, item) => `is:${getItemDamageShortName(item)}`
    },
    items[0]?.bucket.inArmor && {
      id: 'energy',
      header: 'Energy',
      value: (item) => item.isDestiny2() && item.energy?.energyCapacity,
      defaultSort: SortDirection.DESC,
      filter: (value) => `energycapacity>=:${value}`
    },
    {
      id: 'locked',
      header: <AppIcon icon={lockIcon} />,
      value: (i) => i.locked,
      cell: (value) => (value ? <AppIcon icon={lockIcon} /> : undefined),
      defaultSort: SortDirection.DESC,
      filter: (value) => (value ? 'is:locked' : 'not:locked')
    },
    {
      id: 'tag',
      header: 'Tag',
      value: (item) => getTag(item, itemInfos),
      cell: (value: TagValue) => <TagIcon tag={value} />,
      sort: compareBy((tag: TagValue) => (tag && tagConfig[tag] ? tagConfig[tag].sortOrder : 1000)),
      filter: (value) => `tag:${value || 'none'}`
    },
    items[0]?.bucket.inWeapons &&
      hasWishList && {
        id: 'wishList',
        header: 'Wish List',
        value: (item) => {
          const roll = wishList?.[item.id];
          return roll ? (roll.isUndesirable ? false : true) : undefined;
        },
        cell: (value) =>
          value !== null ? (
            <AppIcon
              icon={value ? thumbsUpIcon : thumbsDownIcon}
              className={value ? styles.positive : styles.negative}
            />
          ) : undefined,
        sort: compareBy((wishList) => (wishList === undefined ? 0 : wishList === true ? -1 : 1)),
        filter: (value) =>
          value === true ? 'is:wishlist' : value === false ? 'is:trashlist' : 'not:wishlist'
      },
    {
      id: 'reacquireable',
      header: 'Reacquireable',
      value: (item) =>
        item.isDestiny2() &&
        item.collectibleState !== null &&
        !(item.collectibleState & DestinyCollectibleState.NotAcquired) &&
        !(item.collectibleState & DestinyCollectibleState.PurchaseDisabled),
      defaultSort: SortDirection.DESC,
      cell: booleanCell,
      filter: (value) => (value ? 'is:reacquireable' : 'not:reaquireable')
    },
    $featureFlags.reviewsEnabled && {
      id: 'rating',
      header: 'Rating',
      value: (item) => ratings && getRating(item, ratings)?.overallScore,
      cell: (overallScore: number, item) =>
        overallScore > 0 ? (
          <>
            <RatingIcon rating={overallScore} uiWishListRoll={undefined} />{' '}
            {overallScore.toFixed(1)} ({getRating(item, ratings)?.ratingCount})
          </>
        ) : undefined,
      defaultSort: SortDirection.DESC,
      filter: (value) => `rating:>=${value}`
    },
    {
      id: 'tier',
      header: 'Tier',
      value: (i) => i.tier,
      filter: (value) => `is:${value}`
    },
    {
      id: 'source',
      header: 'Source',
      value: source,
      filter: (value) => `source:${value}`
    },
    {
      id: 'year',
      header: 'Year',
      value: (item) =>
        item.isDestiny1()
          ? item.year
          : item.isDestiny2()
          ? D2SeasonInfo[item.season].year
          : undefined,
      filter: (value) => `year:${value}`
    },
    {
      id: 'season',
      header: 'Season',
      value: (i) => i.isDestiny2() && i.season,
      filter: (value) => `season:${value}`
    },
    {
      id: 'event',
      header: 'Event',
      value: (item) => (item.isDestiny2() && item.event ? D2EventInfo[item.event].name : undefined),
      filter: (value) => `event:${value}`
    },
    items[0]?.bucket.inArmor && {
      id: 'modslot',
      header: 'Mod Slot',
      // TODO: only show if there are mod slots
      value: getItemSpecialtyModSlotDisplayName,
      cell: (value, item) =>
        value && <SpecialtyModSlotIcon className={styles.modslotIcon} item={item} />,
      filter: (value) => `modslot:${value}`
    },
    items[0]?.bucket.inWeapons && {
      id: 'archetype',
      header: 'Archetype',
      value: (item) =>
        !item.isExotic && item.isDestiny2() && !item.energy
          ? item.sockets?.categories.find((c) => c.category.hash === 3956125808)?.sockets[0]?.plug
              ?.plugItem.displayProperties.name
          : undefined,
      cell: (_val, item) =>
        !item.isExotic && item.isDestiny2() && !item.energy ? (
          <div>
            {_.compact([
              item.sockets?.categories.find((c) => c.category.hash === 3956125808)?.sockets[0]
                ?.plug!
            ]).map((p) => (
              <PressTip
                key={p.plugItem.hash}
                tooltip={<PlugTooltip item={item} plug={p} defs={defs} />}
              >
                <div className={styles.modPerk}>
                  <BungieImage src={p.plugItem.displayProperties.icon} />{' '}
                  {p.plugItem.displayProperties.name}
                </div>
              </PressTip>
            ))}
          </div>
        ) : undefined,
      filter: (value) => `perkname:"${value}"`
    },
    {
      id: 'perks',
      header: 'Perks',
      value: () => 0, // TODO: figure out a way to sort perks
      cell: (_, item) => <PerksCell defs={defs} item={item} />,
      noSort: true,
      gridWidth: 'max-content',
      filter: (value) => `perkname:"${value}"`
    },
    {
      id: 'mods',
      header: 'Mods',
      value: () => 0,
      cell: (_, item) => {
        const plugItems = item.isDestiny2()
          ? item.sockets?.categories
              .find((c) => modSocketCategories.includes(c.category.hash))
              ?.sockets.filter((s) => s.plug?.plugItem.collectibleHash || filterPlugs(s))
              .flatMap((s) => s.plugOptions) || []
          : [];
        return (
          plugItems.length > 0 && (
            <div className={styles.modPerks}>
              {item.isDestiny2() &&
                plugItems.map((p) => (
                  <PressTip
                    key={p.plugItem.hash}
                    tooltip={<PlugTooltip item={item} plug={p} defs={defs} />}
                  >
                    <div className={styles.modPerk}>
                      <BungieImage src={p.plugItem.displayProperties.icon} />{' '}
                      {p.plugItem.displayProperties.name}
                    </div>
                  </PressTip>
                ))}
            </div>
          )
        );
      },
      noSort: true
    },
    ...statColumns,
    items[0]?.bucket.inArmor && {
      id: 'customstat',
      header: (
        <>
          Custom Total
          <StatTotalToggle forClass={items[0]?.classType} readOnly={true} />
        </>
      ),
      value: (item) =>
        _.sumBy(item.stats, (s) => (customTotalStat.includes(s.statHash) ? s.value : 0)),
      defaultSort: SortDirection.DESC
    },
    ...baseStatColumns,
    {
      id: 'masterworkTier',
      header: 'Masterwork Tier',
      value: (item) => (item.isDestiny2() ? item.masterworkInfo?.tier : undefined),
      defaultSort: SortDirection.DESC,
      filter: (value) => `masterwork:>=${value}`
    },
    items[0]?.bucket.inWeapons && {
      id: 'killTracker',
      header: 'Kill Tracker',
      value: (item) =>
        (item.isDestiny2() &&
          item.masterworkInfo &&
          Boolean(item.masterwork || item.masterworkInfo.progress) &&
          item.masterworkInfo.typeName &&
          (item.masterworkInfo.progress || 0)) ||
        undefined,
      cell: (value, item) =>
        item.isDestiny2() &&
        (value || value === 0) && (
          <div title={item.masterworkInfo!.typeDesc ?? undefined} className={styles.modPerk}>
            {item.masterworkInfo!.typeIcon && <BungieImage src={item.masterworkInfo!.typeIcon} />}{' '}
            {value}
          </div>
        ),
      defaultSort: SortDirection.DESC
    },
    items[0]?.bucket.inWeapons && {
      id: 'masterworkStat',
      header: 'Masterwork Stat',
      value: (item) => (item.isDestiny2() ? item.masterworkInfo?.statName : undefined)
    },
    {
      id: 'loadouts',
      header: 'Loadouts',
      value: () => 0,
      cell: (_, item) => {
        const inloadouts = loadouts.filter((l) => l.items.some((i) => i.id === item.id));
        return (
          inloadouts.length > 0 && (
            <div>
              {inloadouts.map((loadout) => (
                <div key={loadout.id}>{loadout.name}</div>
              ))}
            </div>
          )
        );
      },
      noSort: true
    },
    {
      id: 'notes',
      header: 'Notes',
      value: (item) => getNotes(item, itemInfos),
      gridWidth: 'minmax(200px, 1fr)',
      filter: (value) => `notes:"${value}"`
    },
    items[0]?.bucket.inWeapons &&
      hasWishList && {
        id: 'wishListNote',
        header: 'Wish List Note',
        value: (item) => wishList?.[item.id]?.notes,
        gridWidth: 'minmax(200px, 1fr)',
        filter: (value) => `wishlistnotes:"${value}"`
      }
  ]);

  return columns;
}

function PerksCell({ defs, item }: { defs: D2ManifestDefinitions; item: DimItem }) {
  const sockets = (item.isDestiny2() && !item.energy && item.sockets?.categories[0]?.sockets) || [];
  if (!sockets.length) {
    return null;
  }
  return (
    <>
      {sockets.map((socket) => {
        const plugOptions = socket.plugOptions.filter(
          (p) => item.isExotic || !p.plugItem.itemCategoryHashes?.includes(INTRINSIC_PLUG_CATEGORY)
        );
        return (
          plugOptions.length > 0 && (
            <div key={socket.socketIndex} className={clsx(styles.modPerks)}>
              {plugOptions.map(
                (p: DimPlug) =>
                  item.isDestiny2() && (
                    <PressTip
                      key={p.plugItem.hash}
                      tooltip={<PlugTooltip item={item} plug={p} defs={defs} />}
                    >
                      <div
                        className={styles.modPerk}
                        data-perk-name={p.plugItem.displayProperties.name}
                      >
                        <BungieImage src={p.plugItem.displayProperties.icon} />{' '}
                        {p.plugItem.displayProperties.name}
                      </div>
                    </PressTip>
                  )
              )}
            </div>
          )
        );
      })}
    </>
  );
}
