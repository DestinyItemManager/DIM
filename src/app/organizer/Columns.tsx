/* eslint-disable react/jsx-key, react/prop-types */
import React from 'react';
import { DimItem, DimPlug, D2Item } from 'app/inventory/item-types';
import { Row, UseRowSelectRowProps, UseRowSelectInstanceProps } from 'react-table';
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
import { getTag, getNotes, tagConfig, DimItemInfo } from 'app/inventory/dim-item-info';
import TagIcon from 'app/inventory/TagIcon';
import { source } from 'app/inventory/spreadsheets';
import ElementIcon from 'app/inventory/ElementIcon';
import { D2SeasonInfo } from 'app/inventory/d2-season-info';
import { D2EventInfo } from 'data/d2/d2-event-info';
import { getRating } from 'app/item-review/reducer';
import { statWhiteList } from 'app/inventory/store/stats';
import { compareBy } from 'app/utils/comparators';
import { rarity } from 'app/shell/filters';
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
import { DimColumn } from './ItemTable';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DtrRating } from 'app/item-review/dtr-api-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { StatTotalToggle, GetItemCustomTotal } from 'app/dim-ui/CustomStatTotal';
// TODO: drop wishlist columns if no wishlist loaded
// TODO: d1/d2 columns
// TODO: stat ranges
// TODO: special stat display? recoil, bars, etc

// TODO: really gotta pass these in... need to figure out data dependencies
// https://github.com/tannerlinsley/react-table/blob/master/docs/api.md

/**
 * This function generates the columns for the react-table instance.
 */
export function getColumns(
  items: DimItem[],
  defs: D2ManifestDefinitions,
  itemInfos: { [key: string]: DimItemInfo },
  ratings: { [key: string]: DtrRating },
  wishList: {
    [key: string]: InventoryWishListRoll;
  }
): DimColumn[] {
  const hasWishList = !_.isEmpty(wishList);

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

  const statColumns = _.sortBy(
    _.map(statHashes, (statInfo, statHashStr) => {
      const statHash = parseInt(statHashStr, 10);
      return {
        id: `stat_${statHash}`,
        Header: () =>
          statInfo.displayProperties.hasIcon ? (
            <BungieImage src={statInfo.displayProperties.icon} />
          ) : (
            statInfo.displayProperties.name
          ),
        statHash,
        accessor: (item: DimItem) => item.stats?.find((s) => s.statHash === statHash)?.value,
        Cell: ({ row: { original: item } }) => <CompareStat item={item} stat={statInfo} />,
        sortType: 'basic',
        sortDescFirst: !statInfo.lowerBetter
      };
    }),
    (s) => statWhiteList.indexOf(s.statHash)
  );

  const baseStatColumns = statColumns.map((column) => ({
    ...column,
    id: `base_${column.statHash}`,
    accessor: (item: DimItem) => item.stats?.find((s) => s.statHash === column.statHash)?.base
  }));

  // TODO: move the column function out into its own thing
  const columns: DimColumn[] = _.compact([
    // Let's make a column for selection
    {
      id: 'selection',
      // The header can use the table's getToggleAllRowsSelectedProps method
      // to render a checkbox
      Header: ({ getToggleAllRowsSelectedProps }: UseRowSelectInstanceProps<DimItem>) => (
        <div>
          <input type="checkbox" {...getToggleAllRowsSelectedProps()} />
        </div>
      ),
      // The cell can use the individual row's getToggleRowSelectedProps method
      // to the render a checkbox
      Cell: ({ row }: { row: Row<DimItem> & UseRowSelectRowProps<DimItem> }) => (
        <div>
          <input type="checkbox" {...row.getToggleRowSelectedProps()} />
        </div>
      )
    },
    {
      Header: 'Icon',
      accessor: 'icon',
      Cell: ({ cell: { value }, row: { original: item } }) => (
        <ItemPopupTrigger item={item}>
          {(ref, onClick) => (
            <div ref={ref} onClick={onClick}>
              <BungieImage src={value} className={styles.icon} />
            </div>
          )}
        </ItemPopupTrigger>
      ),
      disableSortBy: true
    },
    {
      Header: 'Name',
      accessor: 'name',
      filter: (item) => `name:"${item.name}"`
    },
    {
      Header: items[0]?.bucket.inArmor ? 'Element' : 'Damage',
      accessor: (item) =>
        (item.isDestiny1() && item.element?.damageTypeName) ||
        (item.isDestiny2() && item.element?.displayProperties.name) ||
        undefined,
      Cell: ({ row: { original: item } }) => (
        <ElementIcon className={styles.inlineIcon} element={item.element} />
      )
    },
    items[0]?.bucket.inArmor && {
      id: 'energy',
      Header: 'Energy',
      accessor: (item) => item.isDestiny2() && item.energy?.energyCapacity,
      sortType: 'basic',
      sortDescFirst: true
    },
    {
      id: 'power',
      Header: () => <AppIcon icon={powerIndicatorIcon} />,
      accessor: (item) => item.primStat?.value,
      sortDescFirst: true,
      filter: (item) => `power:>=${item.primStat?.value}`
    },
    {
      Header: () => <AppIcon icon={lockIcon} />,
      accessor: 'locked',
      Cell: ({ cell: { value } }) => (value ? <AppIcon icon={lockIcon} /> : null),
      sortType: 'basic',
      sortDescFirst: true,
      filter: (item) => (item.locked ? 'is:locked' : 'not:locked')
    },
    {
      id: 'tag',
      Header: 'Tag',
      accessor: (item) => getTag(item, itemInfos),
      Cell: ({ cell: { value } }) => <TagIcon tag={value} />,
      sortType: compareBy(({ values: { tag } }) =>
        tag && tagConfig[tag] ? tagConfig[tag].sortOrder : 1000
      )
    },
    items[0]?.bucket.inWeapons &&
      hasWishList && {
        id: 'wishList',
        Header: 'Wish List',
        accessor: (item) => {
          const roll = wishList?.[item.id];
          return roll ? (roll.isUndesirable ? false : true) : null;
        },
        Cell: ({ cell: { value } }) =>
          value !== null ? (
            <AppIcon
              icon={value ? thumbsUpIcon : thumbsDownIcon}
              className={value ? styles.positive : styles.negative}
            />
          ) : null,
        sortType: compareBy(({ values: { wishList } }) =>
          wishList === null ? 0 : wishList === true ? -1 : 1
        )
      },
    {
      Header: 'Reacquireable',
      id: 'reacquireable',
      // TODO: figure out how to reuse search filters
      accessor: (item) =>
        item.isDestiny2() &&
        item.collectibleState !== null &&
        !(item.collectibleState & DestinyCollectibleState.NotAcquired) &&
        !(item.collectibleState & DestinyCollectibleState.PurchaseDisabled),
      sortType: 'basic',
      sortDescFirst: true,
      // TODO: boolean renderer
      Cell: ({ cell: { value } }) => (value ? <AppIcon icon={faCheck} /> : null)
    },
    {
      id: 'rating',
      Header: 'Rating',
      accessor: (item) => ratings && getRating(item, ratings)?.overallScore,
      Cell: ({ cell: { value: overallScore }, row: { original: item } }) =>
        overallScore > 0 ? (
          <>
            <RatingIcon rating={overallScore} uiWishListRoll={undefined} />{' '}
            {overallScore.toFixed(1)} ({getRating(item, ratings)?.ratingCount})
          </>
        ) : null,
      sortType: 'basic',
      sortDescFirst: true
    },
    {
      Header: 'Tier',
      accessor: 'tier',
      sortType: compareBy(({ original: item }) => rarity(item))
    },
    {
      Header: 'Source',
      accessor: source
    },
    {
      id: 'year',
      Header: 'Year',
      accessor: (item) =>
        item.isDestiny1() ? item.year : item.isDestiny2() ? D2SeasonInfo[item.season].year : null,
      sortType: 'basic'
    },
    {
      Header: 'Season',
      accessor: 'season',
      sortType: 'basic'
    },
    {
      id: 'event',
      Header: 'Event',
      accessor: (item) => (item.isDestiny2() && item.event ? D2EventInfo[item.event].name : null)
    },
    items[0]?.bucket.inArmor && {
      Header: 'Mod Slot',
      // TODO: only show if there are mod slots
      accessor: getItemSpecialtyModSlotDisplayName, //
      Cell: ({ cell: { value }, row: { original: item } }) =>
        value && <SpecialtyModSlotIcon className={styles.modSlot} item={item} />,
      sortType: 'basic'
    },
    {
      id: 'archetype',
      Header: 'Archetype',
      accessor: (item) =>
        !item.isExotic && item.isDestiny2() && !item.energy
          ? item.sockets?.categories[0]?.sockets[0]?.plug?.plugItem.displayProperties.name
          : null,
      Cell: ({ row: { original: item } }) =>
        !item.isExotic && item.isDestiny2() && !item.energy ? (
          <div>
            {[item.sockets?.categories[0]?.sockets[0]?.plug!].map((p) => (
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
        ) : null
    },
    {
      id: 'perks',
      Header: 'Perks',
      accessor: (item) =>
        item.isDestiny2() && !item.energy
          ? item.sockets?.categories[0]?.sockets
              .flatMap((s) => s.plugOptions)
              .filter(
                (p) =>
                  item.isExotic || !p.plugItem.itemCategoryHashes?.includes(INTRINSIC_PLUG_CATEGORY)
              ) || []
          : [],
      Cell: ({ cell: { value: plugItems }, row: { original: item } }) => (
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
      ),
      disableSortBy: true
    },
    {
      id: 'mods',
      Header: 'Mods',
      accessor: (item) =>
        item.isDestiny2()
          ? item.sockets?.categories[1]?.sockets
              .filter((s) => s.plug?.plugItem.collectibleHash || filterPlugs(s))
              .flatMap((s) => s.plugOptions) || []
          : [],
      Cell: ({ cell: { value: plugItems }, row: { original: item } }) => (
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
      ),
      disableSortBy: true
    },
    {
      id: 'stats',
      Header: 'Stats',
      columns: statColumns
    },
    items[0]?.bucket.inArmor && {
      id: 'customstat',
      Header: (
        <>
          Custom Total
          <StatTotalToggle forClass={items[0]?.classType} readOnly={true} />
        </>
      ),
      accessor: (item: D2Item) => <GetItemCustomTotal item={item} forClass={items[0]?.classType} />
    },
    items[0]?.bucket.inArmor && {
      id: 'basestats',
      Header: 'Base Stats',
      columns: baseStatColumns
    },
    {
      id: 'masterworkTier',
      Header: 'Masterwork Tier',
      accessor: (item) => (item.isDestiny2() ? item.masterworkInfo?.tier : null),
      sortType: 'basic',
      sortDescFirst: true
    },
    items[0]?.bucket.inWeapons && {
      id: 'killTracker',
      Header: 'Kill Tracker',
      accessor: (item) =>
        item.isDestiny2() &&
        item.masterworkInfo &&
        Boolean(item.masterwork || item.masterworkInfo.progress) &&
        item.masterworkInfo.typeName &&
        (item.masterworkInfo.progress || 0),
      Cell: ({ cell: { value }, row: { original: item } }) =>
        item.isDestiny2() &&
        (value || value === 0) && (
          <div title={item.masterworkInfo!.typeDesc ?? undefined} className={styles.modPerk}>
            {item.masterworkInfo!.typeIcon && <BungieImage src={item.masterworkInfo!.typeIcon} />}{' '}
            {value}
          </div>
        ),
      sortType: 'basic',
      sortDescFirst: true
    },
    items[0]?.bucket.inWeapons && {
      id: 'masterworkStat',
      Header: 'Masterwork Stat',
      accessor: (item) => (item.isDestiny2() ? item.masterworkInfo?.statName : null)
    },
    {
      id: 'notes',
      Header: 'Notes',
      accessor: (item) => getNotes(item, itemInfos)
    },
    items[0]?.bucket.inWeapons &&
      hasWishList && {
        id: 'wishListNote',
        Header: 'Wish List Note',
        accessor: (item) => wishList?.[item.id]?.notes
      }
  ]);

  for (const column of columns) {
    if (!column.id) {
      column.id = column.accessor?.toString();
    }
  }

  return columns;
}
