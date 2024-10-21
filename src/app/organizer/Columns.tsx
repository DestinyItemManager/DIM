import { CustomStatDef, DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { StoreIcon } from 'app/character-tile/StoreIcon';
import { StatInfo } from 'app/compare/Compare';
import BungieImage from 'app/dim-ui/BungieImage';
import ElementIcon from 'app/dim-ui/ElementIcon';
import { PressTip, Tooltip } from 'app/dim-ui/PressTip';
import { SpecialtyModSlotIcon } from 'app/dim-ui/SpecialtyModSlotIcon';
import { I18nKey, t, tl } from 'app/i18next-t';
import ItemIcon, { DefItemIcon } from 'app/inventory/ItemIcon';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import NewItemIndicator from 'app/inventory/NewItemIndicator';
import TagIcon from 'app/inventory/TagIcon';
import { TagValue, tagConfig } from 'app/inventory/dim-item-info';
import { D1Item, DimItem, DimSocket } from 'app/inventory/item-types';
import { storesSelector } from 'app/inventory/selectors';
import { isHarmonizable } from 'app/inventory/store/deepsight';
import { getEvent, getSeason } from 'app/inventory/store/season';
import { getStatSortOrder } from 'app/inventory/store/stats';
import { getStore } from 'app/inventory/stores-helpers';
import { ItemStatValue } from 'app/item-popup/ItemStat';
import { KillTrackerInfo } from 'app/item-popup/KillTracker';
import NotesArea from 'app/item-popup/NotesArea';
import { DimPlugTooltip } from 'app/item-popup/PlugTooltip';
import { recoilValue } from 'app/item-popup/RecoilStat';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import InGameLoadoutIcon from 'app/loadout/ingame/InGameLoadoutIcon';
import { InGameLoadout, Loadout, isInGameLoadout } from 'app/loadout/loadout-types';
import { LoadoutsByItem } from 'app/loadout/selectors';
import { breakerTypeNames, weaponMasterworkY2SocketTypeHash } from 'app/search/d2-known-values';
import D2Sources from 'app/search/items/search-filters/d2-sources';
import { quoteFilterString } from 'app/search/query-parser';
import { statHashByName } from 'app/search/search-filter-values';
import { getColor, percent } from 'app/shell/formatters';
import {
  AppIcon,
  lockIcon,
  powerIndicatorIcon,
  thumbsDownIcon,
  thumbsUpIcon,
} from 'app/shell/icons';
import { RootState } from 'app/store/types';
import { filterMap } from 'app/utils/collections';
import { Comparator, compareBy } from 'app/utils/comparators';
import {
  getInterestingSocketMetadatas,
  getItemDamageShortName,
  getItemKillTrackerInfo,
  getItemYear,
  getMasterworkStatNames,
  isArtificeSocket,
  isD1Item,
  isKillTrackerSocket,
} from 'app/utils/item-utils';
import {
  getDisplayedItemSockets,
  getExtraIntrinsicPerkSockets,
  getIntrinsicArmorPerkSocket,
  getSocketsByIndexes,
  getWeaponArchetype,
  getWeaponArchetypeSocket,
  isEnhancedPerk,
  socketContainsIntrinsicPlug,
} from 'app/utils/socket-utils';
import { LookupTable } from 'app/utils/util-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import clsx from 'clsx';
import { D2EventInfo } from 'data/d2/d2-event-info-v2';
import {
  BreakerTypeHashes,
  BucketHashes,
  ItemCategoryHashes,
  PlugCategoryHashes,
  StatHashes,
} from 'data/d2/generated-enums';
import shapedOverlay from 'images/shapedOverlay.png';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { createCustomStatColumns } from './CustomStatColumns';

import {
  buildNodeNames,
  buildSocketNames,
  csvStatNamesForDestinyVersion,
} from 'app/inventory/spreadsheets';
import { DeepsightHarmonizerIcon } from 'app/item-popup/DeepsightHarmonizerIcon';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import styles from './ItemTable.m.scss'; // eslint-disable-line css-modules/no-unused-class
import { ColumnDefinition, ColumnGroup, SortDirection, Value } from './table-types';

/**
 * Get the ID used to select whether this column is shown or not.
 */
export function getColumnSelectionId(column: ColumnDefinition) {
  return column.columnGroup ? column.columnGroup.id : column.id;
}

// Some stat labels are long. This lets us replace them with i18n
export const statLabels: LookupTable<StatHashes, I18nKey> = {
  [StatHashes.RoundsPerMinute]: tl('Organizer.Stats.RPM'),
  [StatHashes.ReloadSpeed]: tl('Organizer.Stats.Reload'),
  [StatHashes.AimAssistance]: tl('Organizer.Stats.Aim'),
  [StatHashes.RecoilDirection]: tl('Organizer.Stats.Recoil'),
  [StatHashes.Attack]: tl('Organizer.Stats.Power'),
  [StatHashes.Defense]: tl('Organizer.Stats.Power'),
  [StatHashes.AirborneEffectiveness]: tl('Organizer.Stats.Airborne'),
};

const perkStringSort: Comparator<string | undefined> = (a, b) => {
  const aParts = (a ?? '').split(',');
  const bParts = (b ?? '').split(',');
  let ai = 0;
  let bi = 0;
  while (ai < aParts.length && bi < bParts.length) {
    const aPart = aParts[ai];
    const bPart = bParts[bi];
    if (aPart === bPart) {
      ai++;
      bi++;
      continue;
    }
    return aPart.localeCompare(bPart) as 1 | 0 | -1;
  }
  return 0;
};

const perkStringFilter = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }
  return value
    .split(',')
    .map((perk) => `exactperk:"${perk}"`)
    .join(' ');
};

/**
 * This function generates the columns.
 */
export function getColumns(
  useCase: 'organizer' | 'spreadsheet',
  itemsType: 'weapon' | 'armor' | 'ghost',
  statHashes: {
    [statHash: number]: StatInfo;
  },
  getTag: (item: DimItem) => TagValue | undefined,
  getNotes: (item: DimItem) => string | undefined,
  wishList: (item: DimItem) => InventoryWishListRoll | undefined,
  hasWishList: boolean,
  customStatDefs: CustomStatDef[],
  loadoutsByItem: LoadoutsByItem,
  newItems: Set<string>,
  destinyVersion: DestinyVersion,
  onPlugClicked?: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void,
): ColumnDefinition[] {
  const customStatHashes = customStatDefs.map((c) => c.statHash);
  const statsGroup: ColumnGroup = {
    id: 'stats',
    header: t('Organizer.Columns.Stats'),
  };
  const baseStatsGroup: ColumnGroup = {
    id: 'baseStats',
    header: t('Organizer.Columns.BaseStats'),
  };
  const statQualityGroup: ColumnGroup = {
    id: 'statQuality',
    header: t('Organizer.Columns.StatQuality'),
  };

  const csvStatNames = csvStatNamesForDestinyVersion(destinyVersion);

  type ColumnWithStat = ColumnDefinition & { statHash: StatHashes };
  const statColumns: ColumnWithStat[] = filterMap(
    Object.entries(statHashes),
    ([statHashStr, statInfo]): ColumnWithStat | undefined => {
      const statHash = parseInt(statHashStr, 10) as StatHashes;
      if (customStatHashes.includes(statHash)) {
        // Exclude custom total, it has its own column
        return undefined;
      }
      const statLabel = statLabels[statHash];

      return {
        id: `stat${statHash}`,
        header: statInfo.displayProperties.hasIcon ? (
          <span title={statInfo.displayProperties.name}>
            <BungieImage src={statInfo.displayProperties.icon} />
          </span>
        ) : statLabel ? (
          t(statLabel)
        ) : (
          statInfo.displayProperties.name
        ),
        statHash,
        columnGroup: statsGroup,
        value: (item: DimItem) => {
          const stat = item.stats?.find((s) => s.statHash === statHash);
          if (stat?.statHash === StatHashes.RecoilDirection) {
            return recoilValue(stat.value);
          }
          return stat?.value;
        },
        cell: (_val, item: DimItem) => {
          const stat = item.stats?.find((s) => s.statHash === statHash);
          if (!stat) {
            return null;
          }
          return <ItemStatValue stat={stat} item={item} />;
        },
        defaultSort: statInfo.lowerBetter ? SortDirection.ASC : SortDirection.DESC,
        filter: (value) => {
          const statName = _.invert(statHashByName)[statHash];
          return `stat:${statName}:${statName === 'rof' ? '=' : '>='}${value}`;
        },
        csv: (_value, item) => {
          // Re-find the stat instead of using the value passed in, because the
          // value passed in can be different if it's Recoil.
          const stat = item.stats?.find((s) => s.statHash === statHash);
          return [csvStatNames.get(statHash) ?? `UnknownStat ${statHash}`, stat?.value ?? 0];
        },
      };
    },
  ).sort(compareBy((s) => getStatSortOrder(s.statHash)));

  const isGhost = itemsType === 'ghost';
  const isArmor = itemsType === 'armor';
  const isWeapon = itemsType === 'weapon';
  const isSpreadsheet = useCase === 'spreadsheet';

  const baseStatColumns: ColumnWithStat[] =
    destinyVersion === 2 && (isArmor || !isSpreadsheet)
      ? statColumns.map((column) => ({
          ...column,
          id: `base${column.statHash}`,
          columnGroup: baseStatsGroup,
          value: (item: DimItem): number | undefined => {
            const stat = item.stats?.find((s) => s.statHash === column.statHash);
            if (stat?.statHash === StatHashes.RecoilDirection) {
              return recoilValue(stat.base);
            }
            return stat?.base;
          },
          cell: (_val, item: DimItem) => {
            const stat = item.stats?.find((s) => s.statHash === column.statHash);
            if (!stat) {
              return null;
            }
            return <ItemStatValue stat={stat} item={item} baseStat />;
          },
          filter: (value) => `basestat:${_.invert(statHashByName)[column.statHash]}:>=${value}`,
          csv: (_value, item) => {
            // Re-find the stat instead of using the value passed in, because the
            // value passed in can be different if it's Recoil.
            const stat = item.stats?.find((s) => s.statHash === column.statHash);
            return [
              `${csvStatNames.get(column.statHash) ?? `UnknownStatBase ${column.statHash}`} (Base)`,
              stat?.base ?? 0,
            ];
          },
        }))
      : [];

  const d1ArmorQualityByStat =
    destinyVersion === 1 && isArmor
      ? Object.entries(statHashes)
          .map(([statHashStr, statInfo]): ColumnWithStat => {
            const statHash = parseInt(statHashStr, 10) as StatHashes;
            return {
              statHash,
              id: `quality_${statHash}`,
              columnGroup: statQualityGroup,
              header: t('Organizer.Columns.StatQualityStat', {
                stat: statInfo.displayProperties.name,
              }),
              value: (item: D1Item) => {
                const stat = item.stats?.find((s) => s.statHash === statHash);
                let pct = 0;
                if (stat?.scaled?.min) {
                  pct = Math.round((100 * stat.scaled.min) / (stat.split || 1));
                }
                return pct;
              },
              cell: (value: number, item: D1Item) => {
                const stat = item.stats?.find((s) => s.statHash === statHash);
                return (
                  <span style={getColor(stat?.qualityPercentage?.min || 0, 'color')}>{value}%</span>
                );
              },
              csv: (_value, item) => {
                if (!isD1Item(item)) {
                  throw new Error('Expected D1 item');
                }
                const stat = item.stats?.find((s) => s.statHash === statHash);
                return [
                  `% ${csvStatNames.get(statHash) ?? `UnknownStat ${statHash}`}Q`,
                  stat?.scaled?.min ? Math.round((100 * stat.scaled.min) / (stat.split || 1)) : 0,
                ];
              },
            };
          })
          .sort(compareBy((s) => getStatSortOrder(s.statHash)))
      : [];

  /**
   * This helper allows TypeScript to perform type inference to determine the
   * type of V based on its arguments. This allows us to automatically type the
   * various column methods like `cell` and `filter` automatically based on the
   * return type of `value`.
   */
  /*@__INLINE__*/
  function c<V extends Value>(columnDef: ColumnDefinition<V>): ColumnDefinition<V> {
    return columnDef;
  }

  const customStats = isSpreadsheet ? [] : createCustomStatColumns(customStatDefs);

  const columns: ColumnDefinition[] = _.compact([
    !isSpreadsheet &&
      c({
        id: 'icon',
        header: t('Organizer.Columns.Icon'),
        value: (i) => i.icon,
        cell: (_val, item) => (
          <ItemPopupTrigger item={item}>
            {(ref, onClick) => (
              <div ref={ref} onClick={onClick} className="item">
                <ItemIcon item={item} />
                {item.crafted && <img src={shapedOverlay} className={styles.shapedIconOverlay} />}
              </div>
            )}
          </ItemPopupTrigger>
        ),
        noSort: true,
        noHide: true,
      }),
    c({
      id: 'name',
      header: t('Organizer.Columns.Name'),
      csv: 'Name',
      value: (i) => i.name,
      filter: (name) => `name:${quoteFilterString(name)}`,
    }),
    isSpreadsheet &&
      c({
        id: 'hash',
        header: 'Hash',
        csv: 'Hash',
        value: (i) => i.hash,
      }),
    isSpreadsheet &&
      c({
        id: 'id',
        header: 'Id',
        csv: 'Id',
        value: (i) => `"${i.id}"`,
      }),
    !isGhost &&
      c({
        id: 'power',
        csv: destinyVersion === 2 ? 'Power' : 'Light',
        header: <AppIcon icon={powerIndicatorIcon} />,
        dropdownLabel: t('Organizer.Columns.Power'),
        value: (item) => item.power,
        defaultSort: SortDirection.DESC,
        filter: (value) => `power:>=${value}`,
      }),
    isWeapon &&
      c({
        id: 'dmg',
        header: t('Organizer.Columns.Damage'),
        csv: 'Element',
        value: (item) => item.element?.displayProperties.name,
        cell: (_val, item) => <ElementIcon className={styles.inlineIcon} element={item.element} />,
        filter: (_val, item) => `is:${getItemDamageShortName(item)}`,
      }),
    isArmor &&
      isSpreadsheet &&
      c({
        id: 'Equippable',
        header: 'Equippable',
        csv: 'Equippable',
        value: (item) =>
          item.classType === DestinyClass.Unknown ? 'Any' : item.classTypeNameLocalized,
      }),
    (isArmor || isGhost) &&
      destinyVersion === 2 &&
      c({
        id: 'energy',
        header: t('Organizer.Columns.Energy'),
        csv: 'Energy Capacity',
        value: (item) => item.energy?.energyCapacity,
        defaultSort: SortDirection.DESC,
        filter: (value) => `energycapacity:>=${value}`,
      }),
    c({
      id: 'locked',
      header: <AppIcon icon={lockIcon} />,
      csv: 'Locked',
      dropdownLabel: t('Organizer.Columns.Locked'),
      value: (i) => i.locked,
      cell: (value) => (value ? <AppIcon icon={lockIcon} /> : undefined),
      defaultSort: SortDirection.DESC,
      filter: (value) => `${value ? '' : '-'}is:locked`,
    }),
    c({
      id: 'tag',
      header: t('Organizer.Columns.Tag'),
      value: (item) => getTag(item) ?? '',
      cell: (value) => value && <TagIcon tag={value} />,
      sort: compareBy((tag) => (tag && tag in tagConfig ? tagConfig[tag].sortOrder : 1000)),
      filter: (value) => `tag:${value || 'none'}`,
      csv: (value) => ['Tag', value || undefined],
    }),
    !isSpreadsheet &&
      c({
        id: 'new',
        header: t('Organizer.Columns.New'),
        value: (item) => newItems.has(item.id),
        cell: (value) => (value ? <NewItemIndicator /> : undefined),
        defaultSort: SortDirection.DESC,
        filter: (value) => `${value ? '' : '-'}is:new`,
      }),
    destinyVersion === 2 &&
      isWeapon &&
      c({
        id: 'crafted',
        header: t('Organizer.Columns.Crafted'),
        value: (item) => item.craftedInfo?.craftedDate,
        cell: (craftedDate) =>
          craftedDate ? <>{new Date(craftedDate * 1000).toLocaleString()}</> : undefined,
        defaultSort: SortDirection.DESC,
        filter: (value) => `${value ? '' : '-'}is:crafted`,
        // TODO: nicer to put the date in the CSV
        csv: (value) => ['Crafted', value ? 'crafted' : false],
      }),
    !isSpreadsheet &&
      c({
        id: 'recency',
        header: t('Organizer.Columns.Recency'),
        value: (item) => item.id,
        cell: () => '',
      }),
    destinyVersion === 2 &&
      isWeapon &&
      !isSpreadsheet &&
      c({
        id: 'wishList',
        header: t('Organizer.Columns.WishList'),
        value: (item) => {
          const roll = wishList(item);
          return roll ? !roll.isUndesirable : undefined;
        },
        cell: (value) =>
          value !== undefined ? (
            <AppIcon
              icon={value ? thumbsUpIcon : thumbsDownIcon}
              className={value ? styles.positive : styles.negative}
            />
          ) : undefined,
        sort: compareBy((wishList) => (wishList === undefined ? 0 : wishList ? -1 : 1)),
        filter: (value) =>
          value === true ? 'is:wishlist' : value === false ? 'is:trashlist' : '-is:wishlist',
      }),
    c({
      id: 'tier',
      header: t('Organizer.Columns.Tier'),
      csv: 'Tier',
      value: (i) => i.tier,
      filter: (value) => `is:${value}`,
    }),
    isSpreadsheet &&
      !isGhost &&
      c({
        id: 'Type',
        header: 'Type',
        csv: 'Type',
        value: (i) => i.typeName,
      }),
    isSpreadsheet &&
      isWeapon &&
      c({
        id: 'Category',
        header: 'Category',
        csv: 'Category',
        value: (i) => {
          switch (i.bucket.hash) {
            case BucketHashes.KineticWeapons:
              return i.destinyVersion === 2 ? 'KineticSlot' : 'Primary';
            case BucketHashes.EnergyWeapons:
              return i.destinyVersion === 2 ? 'Energy' : 'Special';
            case BucketHashes.PowerWeapons:
              return i.destinyVersion === 2 ? 'Power' : 'Heavy';
            default:
              return i.bucket.name;
          }
        },
      }),
    isSpreadsheet &&
      c({
        id: 'Equipped',
        header: 'Equipped',
        csv: 'Equipped',
        value: (i) => i.equipped,
      }),
    destinyVersion === 2 &&
      isArmor &&
      c({
        id: 'modslot',
        header: t('Organizer.Columns.ModSlot'),
        // TODO: only show if there are mod slots
        value: (item) =>
          getInterestingSocketMetadatas(item)
            ?.map((m) => m.slotTag)
            .join(','),
        cell: (value, item) =>
          value && (
            <SpecialtyModSlotIcon
              className={styles.modslotIcon}
              item={item}
              excludeStandardD2ModSockets
            />
          ),
        filter: (value) =>
          value !== undefined
            ? value
                .split(',')
                .map((m) => `modslot:${m}`)
                .join(' ')
            : ``,
        csv: (value) => [
          'Seasonal Mod',
          // Yes, this is an array most of the time, or an empty string
          value?.split(',') ?? '',
        ],
      }),
    destinyVersion === 1 &&
      c({
        id: 'percentComplete',
        header: t('Organizer.Columns.PercentComplete'),
        csv: '% Leveled',
        value: (item) => item.percentComplete,
        cell: (value) => percent(value),
        filter: (value) => `percentage:>=${value}`,
      }),
    destinyVersion === 2 &&
      isWeapon &&
      !isSpreadsheet &&
      c({
        id: 'archetype',
        header: t('Organizer.Columns.Archetype'),
        value: (item) => getWeaponArchetype(item)?.displayProperties.name,
        cell: (_val, item) => {
          const plugged = getWeaponArchetypeSocket(item)?.plugged;
          return (
            plugged && (
              <PressTip
                key={plugged.plugDef.hash}
                tooltip={() => <DimPlugTooltip item={item} plug={plugged} />}
              >
                <div className={styles.modPerk}>
                  <div className={styles.miniPerkContainer}>
                    <DefItemIcon itemDef={plugged.plugDef} borderless={true} />
                  </div>{' '}
                  {plugged.plugDef.displayProperties.name}
                </div>
              </PressTip>
            )
          );
        },
        filter: (value) => (value ? `exactperk:${quoteFilterString(value)}` : undefined),
      }),
    destinyVersion === 2 &&
      isWeapon &&
      !isSpreadsheet &&
      c({
        id: 'breaker',
        header: t('Organizer.Columns.Breaker'),
        value: (item) => item.breakerType?.displayProperties.name,
        cell: (value, item) =>
          value && (
            <BungieImage
              className={styles.inlineIcon}
              src={item.breakerType!.displayProperties.icon}
            />
          ),
        filter: (_val, item) =>
          item.breakerType
            ? `breaker:${breakerTypeNames[item.breakerType.hash as BreakerTypeHashes]}`
            : undefined,
      }),
    destinyVersion === 2 &&
      isArmor &&
      !isSpreadsheet &&
      c({
        id: 'intrinsics',
        header: t('Organizer.Columns.Intrinsics'),
        value: (item) => perkString(getIntrinsicSockets(item)),
        cell: (_val, item) => (
          <PerksCell
            item={item}
            sockets={getIntrinsicSockets(item)}
            onPlugClicked={onPlugClicked}
          />
        ),
        sort: perkStringSort,
        filter: perkStringFilter,
      }),
    c({
      id: 'perks',
      header:
        destinyVersion === 2
          ? isWeapon
            ? t('Organizer.Columns.OtherPerks')
            : t('Organizer.Columns.PerksMods')
          : t('Organizer.Columns.Perks'),
      value: (item) => perkString(getSockets(item, 'all')),
      cell: (_val, item) =>
        isD1Item(item) ? (
          <D1PerksCell item={item} />
        ) : (
          <PerksCell item={item} sockets={getSockets(item, 'all')} onPlugClicked={onPlugClicked} />
        ),
      sort: perkStringSort,
      filter: perkStringFilter,
      csv: (_value, item) => {
        // This could go on any of the perks columns, since it computes a very
        // different view of perks, but I just picked one.
        const perks =
          isD1Item(item) && item.talentGrid
            ? buildNodeNames(item.talentGrid.nodes)
            : item.sockets
              ? buildSocketNames(item)
              : [];

        // Return multiple columns
        return [`Perks`, perks];
      },
    }),
    destinyVersion === 2 &&
      isWeapon &&
      !isSpreadsheet &&
      c({
        id: 'traits',
        header: t('Organizer.Columns.Traits'),
        value: (item) => perkString(getSockets(item, 'traits')),
        cell: (_val, item) => (
          <PerksCell
            item={item}
            sockets={getSockets(item, 'traits')}
            onPlugClicked={onPlugClicked}
          />
        ),
        sort: perkStringSort,
        filter: perkStringFilter,
      }),

    destinyVersion === 2 &&
      isWeapon &&
      !isSpreadsheet &&
      c({
        id: 'originTrait',
        header: t('Organizer.Columns.OriginTraits'),
        value: (item) => perkString(getSockets(item, 'origin')),
        cell: (_val, item) => (
          <PerksCell
            item={item}
            sockets={getSockets(item, 'origin')}
            onPlugClicked={onPlugClicked}
          />
        ),
        sort: perkStringSort,
        filter: perkStringFilter,
      }),
    destinyVersion === 2 &&
      !isSpreadsheet &&
      c({
        id: 'shaders',
        header: t('Organizer.Columns.Shaders'),
        value: (item) => perkString(getSockets(item, 'shaders')),
        cell: (_val, item) => (
          <PerksCell
            item={item}
            sockets={getSockets(item, 'shaders')}
            onPlugClicked={onPlugClicked}
          />
        ),
        sort: perkStringSort,
        filter: perkStringFilter,
      }),
    ...statColumns,
    ...baseStatColumns,
    ...d1ArmorQualityByStat,
    destinyVersion === 1 &&
      isArmor &&
      c({
        id: 'quality',
        header: t('Organizer.Columns.Quality'),
        csv: '% Quality',
        value: (item) => (isD1Item(item) && item.quality ? item.quality.min : 0),
        cell: (value) => <span style={getColor(value, 'color')}>{value}%</span>,
        filter: (value) => `quality:>=${value}`,
      }),
    ...(destinyVersion === 2 && isArmor ? customStats : []),
    destinyVersion === 2 &&
      isWeapon &&
      c({
        id: 'masterworkTier',
        header: t('Organizer.Columns.MasterworkTier'),
        value: (item) => item.masterworkInfo?.tier,
        defaultSort: SortDirection.DESC,
        filter: (value) => `masterwork:>=${value}`,
        csv: 'Masterwork Tier',
      }),
    destinyVersion === 2 &&
      isWeapon &&
      c({
        id: 'masterworkStat',
        header: t('Organizer.Columns.MasterworkStat'),
        value: (item) => getMasterworkStatNames(item.masterworkInfo),
        csv: 'Masterwork Type',
      }),
    destinyVersion === 2 &&
      isWeapon &&
      c({
        id: 'level',
        header: t('Organizer.Columns.Level'),
        value: (item) => item.craftedInfo?.level,
        defaultSort: SortDirection.DESC,
        csv: (value) => ['Crafted Level', value ?? 0],
      }),
    destinyVersion === 2 &&
      isWeapon &&
      !isSpreadsheet &&
      c({
        id: 'harmonizable',
        header: t('Organizer.Columns.Harmonizable'),
        value: (item) => isHarmonizable(item),
        cell: (value, item) => (value ? <DeepsightHarmonizerIcon item={item} /> : undefined),
      }),
    destinyVersion === 2 &&
      isWeapon &&
      c({
        id: 'killTracker',
        header: t('Organizer.Columns.KillTracker'),
        value: (item) => {
          const killTrackerInfo = getItemKillTrackerInfo(item);
          return killTrackerInfo?.count;
        },
        cell: (_val, item) => {
          const killTrackerInfo = getItemKillTrackerInfo(item);
          return (
            killTrackerInfo && (
              <KillTrackerInfo tracker={killTrackerInfo} className={styles.killTrackerDisplay} />
            )
          );
        },
        defaultSort: SortDirection.DESC,
        csv: (value) => ['Kill Tracker', value ?? 0],
      }),
    destinyVersion === 2 &&
      isWeapon &&
      c({
        id: 'foundry',
        header: t('Organizer.Columns.Foundry'),
        csv: 'Foundry',
        value: (item) => item.foundry,
        filter: (value) => `foundry:${value}`,
      }),
    destinyVersion === 2 &&
      c({
        id: 'source',
        csv: 'Source',
        header: t('Organizer.Columns.Source'),
        value: source,
        filter: (value) => `source:${value}`,
      }),
    c({
      id: 'year',
      csv: 'Year',
      header: t('Organizer.Columns.Year'),
      value: (item) => getItemYear(item),
      filter: (value) => `year:${value}`,
    }),
    destinyVersion === 2 &&
      c({
        id: 'season',
        csv: 'Season',
        header: t('Organizer.Columns.Season'),
        value: (i) => getSeason(i),
        filter: (value) => `season:${value}`,
      }),
    destinyVersion === 2 &&
      c({
        id: 'event',
        header: t('Organizer.Columns.Event'),
        value: (item) => {
          const event = getEvent(item);
          return event ? D2EventInfo[event].name : undefined;
        },
        filter: (value) => `event:${value}`,
        csv: (value) => ['Event', value ?? ''],
      }),
    c({
      id: 'location',
      header: t('Organizer.Columns.Location'),
      value: (item) => item.owner,
      cell: (_val, item) => <StoreLocation storeId={item.owner} />,
      csv: (value, _item, { storeNamesById }) => ['Owner', storeNamesById[value]],
    }),
    c({
      id: 'loadouts',
      header: t('Organizer.Columns.Loadouts'),
      value: (item) => {
        const loadouts = loadoutsByItem[item.id];
        // The raw comparison value compares by number of loadouts first,
        // then by first loadout name
        return (
          loadouts &&
          // 99999 loadouts ought to be enough for anyone
          `${loadouts.length.toString().padStart(5, '0')}:${loadouts
            .map((l) => l.loadout.name)
            .sort()
            .join(',')}`
        );
      },
      cell: (_val, item) => {
        const inloadouts = loadoutsByItem[item.id];
        return (
          inloadouts &&
          inloadouts.length > 0 && (
            <LoadoutsCell
              loadouts={inloadouts.map((l) => l.loadout).sort(compareBy((l) => l.name))}
              owner={item.owner}
            />
          )
        );
      },
      filter: (value, item) => {
        if (typeof value === 'string') {
          const inloadouts = loadoutsByItem[item.id];
          const loadout = inloadouts?.find(({ loadout }) => loadout.id === value);
          return loadout && `inloadout:${quoteFilterString(loadout.loadout.name)}`;
        }
      },
      csv: (value) => ['Loadouts', value ?? ''],
    }),
    c({
      id: 'notes',
      header: t('Organizer.Columns.Notes'),
      // It's important for the value to always be a string, because users
      // expect to be able to sort empty notes along with items that have notes.
      // See https://github.com/DestinyItemManager/DIM/issues/10694
      value: (item) => getNotes(item) ?? '',
      cell: (_val, item) => <NotesArea item={item} minimal={true} />,
      gridWidth: 'minmax(200px, 1fr)',
      filter: (value) => `notes:${quoteFilterString(value)}`,
      csv: (value) => ['Notes', value || undefined],
    }),
    isWeapon &&
      hasWishList &&
      c({
        id: 'wishListNote',
        header: t('Organizer.Columns.WishListNotes'),
        value: (item) => wishList(item)?.notes?.trim() ?? '',
        gridWidth: 'minmax(200px, 1fr)',
        filter: (value) => `wishlistnotes:${quoteFilterString(value)}`,
      }),
  ]);

  return columns;
}

function LoadoutsCell({
  loadouts,
  owner,
}: {
  loadouts: (Loadout | InGameLoadout)[];
  owner: string;
}) {
  return (
    <>
      {loadouts.map((loadout) => (
        <div key={loadout.id} className={styles.loadout}>
          {isInGameLoadout(loadout) ? (
            <a data-filter-value={loadout.id}>
              {isInGameLoadout(loadout) && <InGameLoadoutIcon loadout={loadout} />}
              {loadout.name}
            </a>
          ) : (
            <a
              data-filter-value={loadout.id}
              onClick={(e: React.MouseEvent) =>
                !e.shiftKey && editLoadout(loadout, owner, { isNew: false })
              }
            >
              {loadout.name}
            </a>
          )}
        </div>
      ))}
    </>
  );
}

function PerksCell({
  item,
  sockets,
  onPlugClicked,
}: {
  item: DimItem;
  sockets: DimSocket[];
  onPlugClicked?: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void;
}) {
  if (!sockets.length) {
    return null;
  }

  return (
    <>
      {sockets.map((socket) => (
        <div
          key={socket.socketIndex}
          className={clsx(styles.modPerks, {
            [styles.isPerk]: socket.isPerk && socket.plugOptions.length > 1,
          })}
        >
          {socket.plugOptions.map((p) => (
            <PressTip key={p.plugDef.hash} tooltip={() => <DimPlugTooltip item={item} plug={p} />}>
              <div
                className={clsx(styles.modPerk, {
                  [styles.perkSelected]:
                    socket.isPerk && socket.plugOptions.length > 1 && p === socket.plugged,
                  [styles.perkSelectable]: socket.plugOptions.length > 1,
                  [styles.enhancedArrow]: isEnhancedPerk(p.plugDef),
                })}
                data-filter-value={p.plugDef.displayProperties.name}
                onClick={
                  onPlugClicked && socket.plugOptions.length > 1
                    ? (e: React.MouseEvent) => {
                        if (!e.shiftKey) {
                          e.stopPropagation();
                          onPlugClicked({ item, socket, plugHash: p.plugDef.hash });
                        }
                      }
                    : undefined
                }
              >
                <div className={styles.miniPerkContainer}>
                  <DefItemIcon itemDef={p.plugDef} borderless={true} />
                </div>
                {p.plugDef.displayProperties.name}
              </div>
            </PressTip>
          ))}
        </div>
      ))}
    </>
  );
}

function D1PerksCell({ item }: { item: D1Item }) {
  if (!isD1Item(item) || !item.talentGrid) {
    return null;
  }
  const sockets = Object.values(
    Object.groupBy(
      item.talentGrid.nodes.filter((n) => n.column > 0),
      (n) => n.column,
    ),
  );

  if (!sockets.length) {
    return null;
  }
  return (
    <>
      {sockets.map((socket) => (
        <div
          key={socket[0].column}
          className={clsx(styles.modPerks, {
            [styles.isPerk]: socket.length > 1 && socket[0].exclusiveInColumn,
          })}
        >
          {socket.map(
            (p) =>
              isD1Item(item) && (
                <PressTip
                  key={p.hash}
                  tooltip={
                    <>
                      <Tooltip.Header text={p.name} />
                      <div>{p.description}</div>
                    </>
                  }
                >
                  <div className={styles.modPerk} data-filter-value={p.name}>
                    <div className={styles.miniPerkContainer}>
                      <BungieImage src={p.icon} />
                    </div>{' '}
                    {p.name}
                    {(!p.unlocked || p.xp < p.xpRequired) && <> ({percent(p.xp / p.xpRequired)})</>}
                  </div>
                </PressTip>
              ),
          )}
        </div>
      ))}
    </>
  );
}

function StoreLocation({ storeId }: { storeId: string }) {
  const store = useSelector((state: RootState) => getStore(storesSelector(state), storeId)!);

  return (
    <div className={styles.locationCell}>
      <StoreIcon store={store} /> {store.className}
    </div>
  );
}

function perkString(sockets: DimSocket[]): string | undefined {
  if (!sockets.length) {
    return undefined;
  }

  return sockets
    .flatMap((socket) => socket.plugOptions.map((p) => p.plugDef.displayProperties.name))
    .filter(Boolean)
    .join(',');
}

function getSockets(
  item: DimItem,
  type?: 'all' | 'traits' | 'barrel' | 'shaders' | 'origin',
): DimSocket[] {
  if (!item.sockets) {
    return [];
  }

  let sockets = [];
  const { modSocketsByCategory, perks } = getDisplayedItemSockets(
    item,
    /* excludeEmptySockets */ true,
  )!;

  if (perks) {
    sockets.push(...getSocketsByIndexes(item.sockets, perks.socketIndexes));
  }
  switch (type) {
    case 'traits':
      sockets = sockets.filter(
        (s) =>
          s.plugged &&
          (s.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Frames ||
            s.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Intrinsics),
      );
      break;

    case 'origin':
      sockets = sockets.filter((s) =>
        s.plugged?.plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsOriginTraits),
      );
      break;

    case 'shaders': {
      sockets.push(...[...modSocketsByCategory.values()].flat());
      sockets = sockets.filter(
        (s) =>
          s.plugged &&
          (s.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Shader ||
            s.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Mementos ||
            s.plugged.plugDef.plug.plugCategoryIdentifier.includes('skin')),
      );
      break;
    }

    default: {
      // Improve this when we use iterator-helpers
      sockets.push(...[...modSocketsByCategory.values()].flat());
      sockets = sockets.filter(
        (s) =>
          !(
            s.plugged &&
            (s.plugged?.plugDef.itemCategoryHashes?.includes(
              ItemCategoryHashes.WeaponModsOriginTraits,
            ) ||
              s.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Frames ||
              s.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Intrinsics ||
              s.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Shader ||
              s.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Mementos ||
              s.plugged.plugDef.plug.plugCategoryIdentifier.includes('skin'))
          ),
      );
      break;
    }
  }

  sockets = sockets.filter(
    (s) =>
      // we have a separate column for the kill tracker
      !isKillTrackerSocket(s) &&
      // and for the regular weapon masterworks
      s.socketDefinition.socketTypeHash !== weaponMasterworkY2SocketTypeHash &&
      // Remove "extra intrinsics" for exotic class items
      (!item.bucket.inArmor || !(s.isPerk && s.visibleInGame && socketContainsIntrinsicPlug(s))),
  );
  return sockets;
}

function getIntrinsicSockets(item: DimItem) {
  const intrinsicSocket = getIntrinsicArmorPerkSocket(item);
  const extraIntrinsicSockets = getExtraIntrinsicPerkSockets(item);
  return intrinsicSocket &&
    // artifice already shows up in the "modslot" column
    !isArtificeSocket(intrinsicSocket)
    ? [intrinsicSocket, ...extraIntrinsicSockets]
    : extraIntrinsicSockets;
}

/**
 * This builds stat infos for all the stats that are relevant to a particular category of items.
 * It will return the same result for the same category, since all items in a category share stats.
 */
export function buildStatInfo(items: DimItem[]): {
  [statHash: number]: StatInfo;
} {
  const statHashes: {
    [statHash: number]: StatInfo;
  } = {};
  for (const item of items) {
    if (item.stats) {
      for (const stat of item.stats) {
        if (statHashes[stat.statHash]) {
          // TODO: we don't yet use the min and max values
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
            statMaximumValue: stat.maximumValue,
            bar: stat.bar,
            getStat(item) {
              return item.stats ? item.stats.find((s) => s.statHash === stat.statHash) : undefined;
            },
          };
        }
      }
    }
  }
  return statHashes;
}

// ignore raid & calus sources in favor of more detailed sources
const sourceKeys = Object.keys(D2Sources).filter((k) => !['raid', 'calus'].includes(k));
function source(item: DimItem) {
  if (item.destinyVersion === 2) {
    return (
      sourceKeys.find(
        (src) =>
          (item.source && D2Sources[src].sourceHashes?.includes(item.source)) ||
          D2Sources[src].itemHashes?.includes(item.hash),
      ) || ''
    );
  }
}
