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
import { getItemSpecialtyModSlotDisplayName } from 'app/utils/item-utils';
import SpecialtyModSlotIcon from 'app/dim-ui/SpecialtyModSlotIcon';
import { DestinyCollectibleState } from 'bungie-api-ts/destiny2';
import CompareStat from 'app/compare/CompareStat';
import { StatInfo } from 'app/compare/Compare';
import { filterPlugs } from 'app/loadout-builder/generated-sets/utils';
import PressTip from 'app/dim-ui/PressTip';
import PlugTooltip from 'app/item-popup/PlugTooltip';
import { INTRINSIC_PLUG_CATEGORY } from 'app/inventory/store/sockets';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DtrRating } from 'app/item-review/dtr-api-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { ColumnDefinition, SortDirection } from './table-types';
import { TagValue } from '@destinyitemmanager/dim-api-types';
import clsx from 'clsx';
// TODO: drop wishlist columns if no wishlist loaded
// TODO: d1/d2 columns
// TODO: stat ranges
// TODO: special stat display? recoil, bars, etc

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
  }
): ColumnDefinition[] {
  const hasWishList = !_.isEmpty(wishList);

  // TODO: most of these are constant and can be hoisted?
  // TODO: filter/sort?

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

  const statColumns: (ColumnDefinition & { statHash: number })[] = _.sortBy(
    _.map(statHashes, (statInfo, statHashStr) => {
      const statHash = parseInt(statHashStr, 10);
      return {
        id: `stat_${statHash}`,
        Header: statInfo.displayProperties.hasIcon ? (
          <BungieImage src={statInfo.displayProperties.icon} />
        ) : (
          statInfo.displayProperties.name
        ),
        statHash,
        value: (item: DimItem) => item.stats?.find((s) => s.statHash === statHash)?.value,
        Cell: (_, item) => <CompareStat item={item} stat={statInfo} />,

        sortDescFirst: !statInfo.lowerBetter
      };
    }),
    (s) => statWhiteList.indexOf(s.statHash)
  );

  const baseStatColumns: (ColumnDefinition & { statHash: number })[] = statColumns.map(
    (column) => ({
      ...column,
      id: `base_${column.statHash}`,
      value: (item: DimItem) => item.stats?.find((s) => s.statHash === column.statHash)?.base
    })
  );

  const columns: ColumnDefinition[] = _.compact([
    {
      id: 'icon',
      Header: 'Icon',
      value: (i) => i.icon,
      Cell: (value: string, item) => (
        <ItemPopupTrigger item={item}>
          {(ref, onClick) => (
            <div ref={ref} onClick={onClick}>
              <BungieImage src={value} className={styles.icon} />
            </div>
          )}
        </ItemPopupTrigger>
      ),
      noSort: true
    },
    {
      id: 'name',
      Header: 'Name',
      value: (i) => i.name,
      filter: (name) => `name:"${name}"`
    },
    {
      id: 'dmg',
      Header: items[0]?.bucket.inArmor ? 'Element' : 'Damage',
      value: (item) => item.element?.displayProperties.name,
      Cell: (_, item) => <ElementIcon className={styles.inlineIcon} element={item.element} />
    },
    items[0]?.bucket.inArmor && {
      id: 'energy',
      Header: 'Energy',
      value: (item) => item.isDestiny2() && item.energy?.energyCapacity,
      defaultSort: SortDirection.DESC
    },
    {
      id: 'power',
      Header: <AppIcon icon={powerIndicatorIcon} />,
      value: (item) => item.primStat?.value,
      defaultSort: SortDirection.DESC,
      filter: (value) => `power:>=${value}`
    },
    {
      id: 'locked',
      Header: <AppIcon icon={lockIcon} />,
      value: (i) => i.locked,
      Cell: (value) => (value ? <AppIcon icon={lockIcon} /> : undefined),
      defaultSort: SortDirection.DESC,
      filter: (value) => (value ? 'is:locked' : 'not:locked')
    },
    {
      id: 'tag',
      Header: 'Tag',
      value: (item) => getTag(item, itemInfos),
      Cell: (value: TagValue) => <TagIcon tag={value} />,
      sort: compareBy((tag: TagValue) => (tag && tagConfig[tag] ? tagConfig[tag].sortOrder : 1000))
    },
    items[0]?.bucket.inWeapons &&
      hasWishList && {
        id: 'wishList',
        Header: 'Wish List',
        value: (item) => {
          const roll = wishList?.[item.id];
          return roll ? (roll.isUndesirable ? false : true) : undefined;
        },
        Cell: (value) =>
          value !== null ? (
            <AppIcon
              icon={value ? thumbsUpIcon : thumbsDownIcon}
              className={value ? styles.positive : styles.negative}
            />
          ) : undefined,
        sort: compareBy((wishList) => (wishList === undefined ? 0 : wishList === true ? -1 : 1))
      },
    {
      id: 'reacquireable',
      Header: 'Reacquireable',
      value: (item) =>
        item.isDestiny2() &&
        item.collectibleState !== null &&
        !(item.collectibleState & DestinyCollectibleState.NotAcquired) &&
        !(item.collectibleState & DestinyCollectibleState.PurchaseDisabled),
      defaultSort: SortDirection.DESC,
      // TODO: boolean renderer
      Cell: (value) => (value ? <AppIcon icon={faCheck} /> : undefined)
    },
    $featureFlags.reviewsEnabled && {
      id: 'rating',
      Header: 'Rating',
      value: (item) => ratings && getRating(item, ratings)?.overallScore,
      Cell: (overallScore: number, item) =>
        overallScore > 0 ? (
          <>
            <RatingIcon rating={overallScore} uiWishListRoll={undefined} />{' '}
            {overallScore.toFixed(1)} ({getRating(item, ratings)?.ratingCount})
          </>
        ) : undefined,
      defaultSort: SortDirection.DESC
    },
    /*
    {
      id: 'tier',
      Header: 'Tier',
      value: (i) => i.tier,
      sort: compareBy((item) => rarity(item))
    },
    */
    {
      id: 'source',
      Header: 'Source',
      value: source
    },
    {
      id: 'year',
      Header: 'Year',
      value: (item) =>
        item.isDestiny1()
          ? item.year
          : item.isDestiny2()
          ? D2SeasonInfo[item.season].year
          : undefined
    },
    {
      id: 'season',
      Header: 'Season',
      value: (i) => i.isDestiny2() && i.season
    },
    {
      id: 'event',
      Header: 'Event',
      value: (item) => (item.isDestiny2() && item.event ? D2EventInfo[item.event].name : undefined)
    },
    items[0]?.bucket.inArmor && {
      id: 'modslot',
      Header: 'Mod Slot',
      // TODO: only show if there are mod slots
      value: getItemSpecialtyModSlotDisplayName, //
      Cell: (value, item) =>
        value && <SpecialtyModSlotIcon className={styles.modSlot} item={item} />
    },
    {
      id: 'archetype',
      Header: 'Archetype',
      value: (item) =>
        !item.isExotic && item.isDestiny2() && !item.energy
          ? item.sockets?.categories.find((c) => c.category.hash === 3956125808)?.sockets[0]?.plug
              ?.plugItem.displayProperties.name
          : undefined,
      Cell: (_val, item) =>
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
        ) : undefined
    },
    {
      id: 'perks',
      Header: 'Perks',
      value: () => 0, // TODO: figure out a way to sort perks
      Cell: (_, item) => <PerksCell defs={defs} item={item} />,
      noSort: true,
      gridWidth: 'max-content'
    },
    {
      id: 'mods',
      Header: 'Mods',
      value: () => 0,
      Cell: (_, item) => {
        const plugItems = item.isDestiny2()
          ? item.sockets?.categories[1]?.sockets
              .filter((s) => s.plug?.plugItem.collectibleHash || filterPlugs(s))
              .flatMap((s) => s.plugOptions) || []
          : [];
        return (
          <div className={styles.modPerks}>
            {item.isDestiny2() &&
              plugItems.map((p: DimPlug) => (
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
        );
      },
      noSort: true
    },
    ...statColumns, // TODO: column groups!
    /*
    items[0]?.bucket.inArmor && {
      id: 'customstat',
      Header: (
        <>
          Custom Total
          <StatTotalToggle forClass={items[0]?.classType} readOnly={true} />
        </>
      ),
      value: (item) => customStatTotal(),
      Cell: (_, item: D2Item) => <GetItemCustomTotal item={item} forClass={items[0]?.classType} />
    },
    */
    ...baseStatColumns,
    {
      id: 'masterworkTier',
      Header: 'Masterwork Tier',
      value: (item) => (item.isDestiny2() ? item.masterworkInfo?.tier : undefined),
      defaultSort: SortDirection.DESC
    },
    items[0]?.bucket.inWeapons && {
      id: 'killTracker',
      Header: 'Kill Tracker',
      value: (item) =>
        (item.isDestiny2() &&
          item.masterworkInfo &&
          Boolean(item.masterwork || item.masterworkInfo.progress) &&
          item.masterworkInfo.typeName &&
          (item.masterworkInfo.progress || 0)) ||
        undefined,
      Cell: (value, item) =>
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
      Header: 'Masterwork Stat',
      value: (item) => (item.isDestiny2() ? item.masterworkInfo?.statName : undefined)
    },
    {
      id: 'notes',
      Header: 'Notes',
      value: (item) => getNotes(item, itemInfos),
      gridWidth: '1fr'
    },
    items[0]?.bucket.inWeapons &&
      hasWishList && {
        id: 'wishListNote',
        Header: 'Wish List Note',
        value: (item) => wishList?.[item.id]?.notes,
        gridWidth: '1fr'
      }
  ]);

  return columns;
}

function PerksCell({ defs, item }: { defs: D2ManifestDefinitions; item: DimItem }) {
  const sockets = (item.isDestiny2() && !item.energy && item.sockets?.categories[0]?.sockets) || [];
  return (
    <>
      {sockets.map((socket) => {
        const plugOptions = socket.plugOptions.filter(
          (p) => item.isExotic || !p.plugItem.itemCategoryHashes?.includes(INTRINSIC_PLUG_CATEGORY)
        );
        return (
          <div key={socket.socketIndex} className={clsx(styles.modPerks)}>
            {plugOptions.map(
              (p: DimPlug) =>
                item.isDestiny2() && (
                  <PressTip
                    key={p.plugItem.hash}
                    tooltip={<PlugTooltip item={item} plug={p} defs={defs} />}
                  >
                    <div className={styles.modPerk}>
                      <BungieImage src={p.plugItem.displayProperties.icon} />{' '}
                      {p.plugItem.displayProperties.name}
                    </div>
                  </PressTip>
                )
            )}
          </div>
        );
      })}
    </>
  );
}
