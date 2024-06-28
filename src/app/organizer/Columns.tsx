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
import { source } from 'app/inventory/spreadsheets';
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
import { weaponMasterworkY2SocketTypeHash } from 'app/search/d2-known-values';
import { quoteFilterString } from 'app/search/query-parser';
import { statHashByName } from 'app/search/search-filter-values';
import { getColor, percent } from 'app/shell/formatters';
import {
  AppIcon,
  faCheck,
  lockIcon,
  powerIndicatorIcon,
  thumbsDownIcon,
  thumbsUpIcon,
} from 'app/shell/icons';
import { RootState } from 'app/store/types';
import { filterMap } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import {
  getInterestingSocketMetadatas,
  getItemDamageShortName,
  getItemKillTrackerInfo,
  getItemYear,
  getMasterworkStatNames,
  isD1Item,
  isKillTrackerSocket,
} from 'app/utils/item-utils';
import {
  getDisplayedItemSockets,
  getSocketsByIndexes,
  getWeaponArchetype,
  getWeaponArchetypeSocket,
  isEnhancedPerk,
} from 'app/utils/socket-utils';
import { LookupTable } from 'app/utils/util-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import clsx from 'clsx';
import { D2EventInfo } from 'data/d2/d2-event-info-v2';
import { PlugCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import shapedOverlay from 'images/shapedOverlay.png';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { createCustomStatColumns } from './CustomStatColumns';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './ItemTable.m.scss';
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

// const booleanCell = (value: any) => (value ? <AppIcon icon={faCheck} /> : undefined);

/**
 * This function generates the columns.
 */
export function getColumns(
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
  onPlugClicked: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void,
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

  type ColumnWithStat = ColumnDefinition & { statHash: number };
  const statColumns: ColumnWithStat[] = _.sortBy(
    filterMap(Object.entries(statHashes), ([statHashStr, statInfo]): ColumnWithStat | undefined => {
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
          return stat?.value || 0;
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
      };
    }),
    (s) => getStatSortOrder(s.statHash),
  );

  const isGhost = itemsType === 'ghost';
  const isArmor = itemsType === 'armor';
  const isWeapon = itemsType === 'weapon';

  const baseStatColumns: ColumnWithStat[] =
    destinyVersion === 2
      ? statColumns.map((column) => ({
          ...column,
          id: `base${column.statHash}`,
          columnGroup: baseStatsGroup,
          value: (item: DimItem): number => {
            const stat = item.stats?.find((s) => s.statHash === column.statHash);
            if (stat?.statHash === StatHashes.RecoilDirection) {
              return recoilValue(stat.base);
            }
            return stat?.base || 0;
          },
          cell: (_val, item: DimItem) => {
            const stat = item.stats?.find((s) => s.statHash === column.statHash);
            if (!stat) {
              return null;
            }
            return <ItemStatValue stat={stat} item={item} baseStat />;
          },
          filter: (value) => `basestat:${_.invert(statHashByName)[column.statHash]}:>=${value}`,
        }))
      : [];

  const d1ArmorQualityByStat =
    destinyVersion === 1 && isArmor
      ? _.sortBy(
          Object.entries(statHashes).map(([statHashStr, statInfo]): ColumnWithStat => {
            const statHash = parseInt(statHashStr, 10);
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
            };
          }),
          (s) => getStatSortOrder(s.statHash),
        )
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

  const customStats = createCustomStatColumns(customStatDefs);

  const columns: ColumnDefinition[] = _.compact([
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
      value: (i) => i.name,
      filter: (name) => `name:${quoteFilterString(name)}`,
    }),
    !isGhost &&
      c({
        id: 'power',
        header: <AppIcon icon={powerIndicatorIcon} />,
        dropdownLabel: t('Organizer.Columns.Power'),
        value: (item) => item.power,
        defaultSort: SortDirection.DESC,
        filter: (value) => `power:>=${value}`,
      }),
    !isGhost &&
      (destinyVersion === 2 || isWeapon) &&
      c({
        id: 'dmg',
        header: t('Organizer.Columns.Damage'),
        value: (item) => item.element?.displayProperties.name,
        cell: (_val, item) => <ElementIcon className={styles.inlineIcon} element={item.element} />,
        filter: (_val, item) => `is:${getItemDamageShortName(item)}`,
      }),
    (isArmor || isGhost) &&
      destinyVersion === 2 &&
      c({
        id: 'energy',
        header: t('Organizer.Columns.Energy'),
        value: (item) => item.energy?.energyCapacity,
        defaultSort: SortDirection.DESC,
        filter: (value) => `energycapacity:>=${value}`,
      }),
    c({
      id: 'locked',
      header: <AppIcon icon={lockIcon} />,
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
      sort: compareBy((tag) => (tag && tagConfig[tag] ? tagConfig[tag].sortOrder : 1000)),
      filter: (value) => `tag:${value || 'none'}`,
    }),
    c({
      id: 'new',
      header: t('Organizer.Columns.New'),
      value: (item) => newItems.has(item.id),
      cell: (value) => (value ? <NewItemIndicator /> : undefined),
      defaultSort: SortDirection.DESC,
      filter: (value) => `${value ? '' : '-'}is:new`,
    }),
    destinyVersion === 2 &&
      c({
        id: 'crafted',
        header: t('Organizer.Columns.Crafted'),
        value: (item) => item.craftedInfo?.craftedDate,
        cell: (craftedDate) =>
          craftedDate ? <>{new Date(craftedDate * 1000).toLocaleString()}</> : undefined,
        defaultSort: SortDirection.DESC,
        filter: (value) => `${value ? '' : '-'}is:crafted`,
      }),
    c({
      id: 'recency',
      header: t('Organizer.Columns.Recency'),
      value: (item) => item.id,
      cell: () => '',
    }),
    destinyVersion === 2 &&
      isWeapon &&
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
      value: (i) => i.tier,
      filter: (value) => `is:${value}`,
    }),
    destinyVersion === 2 &&
      c({
        id: 'source',
        header: t('Organizer.Columns.Source'),
        value: source,
        filter: (value) => `source:${value}`,
      }),
    c({
      id: 'year',
      header: t('Organizer.Columns.Year'),
      value: (item) => getItemYear(item),
      filter: (value) => `year:${value}`,
    }),
    destinyVersion === 2 &&
      c({
        id: 'season',
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
      }),
    destinyVersion === 1 &&
      c({
        id: 'percentComplete',
        header: t('Organizer.Columns.PercentComplete'),
        value: (item) => item.percentComplete,
        cell: (value) => percent(value),
        filter: (value) => `percentage:>=${value}`,
      }),
    destinyVersion === 2 &&
      isWeapon &&
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
    (destinyVersion === 2 || isWeapon) &&
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
        filter: (_val, item) => `is:${getItemDamageShortName(item)}`,
      }),
    c({
      id: 'perks',
      header:
        destinyVersion === 2 ? t('Organizer.Columns.PerksMods') : t('Organizer.Columns.Perks'),
      value: () => 0, // TODO: figure out a way to sort perks
      cell: (_val, item) =>
        isD1Item(item) ? (
          <D1PerksCell item={item} />
        ) : (
          <PerksCell item={item} onPlugClicked={onPlugClicked} />
        ),
      noSort: true,
      gridWidth: 'minmax(324px,max-content)',
      filter: (value) =>
        typeof value === 'string' ? `exactperk:${quoteFilterString(value)}` : undefined,
    }),
    destinyVersion === 2 &&
      isWeapon &&
      c({
        id: 'traits',
        header: t('Organizer.Columns.Traits'),
        value: () => 0, // TODO: figure out a way to sort perks
        cell: (_val, item) => (
          <PerksCell item={item} traitsOnly={true} onPlugClicked={onPlugClicked} />
        ),
        noSort: true,
        gridWidth: 'minmax(180px,max-content)',
        filter: (value) =>
          typeof value === 'string' ? `exactperk:${quoteFilterString(value)}` : undefined,
      }),
    ...statColumns,
    ...baseStatColumns,
    ...d1ArmorQualityByStat,
    destinyVersion === 1 &&
      isArmor &&
      c({
        id: 'quality',
        header: t('Organizer.Columns.Quality'),
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
      }),
    destinyVersion === 2 &&
      isWeapon &&
      c({
        id: 'masterworkStat',
        header: t('Organizer.Columns.MasterworkStat'),
        value: (item) => getMasterworkStatNames(item.masterworkInfo),
      }),
    destinyVersion === 2 &&
      isWeapon &&
      c({
        id: 'level',
        header: t('Organizer.Columns.Level'),
        value: (item) => item.craftedInfo?.level,
        defaultSort: SortDirection.DESC,
      }),
    destinyVersion === 2 &&
      isWeapon &&
      c({
        id: 'harmonizable',
        header: t('Organizer.Columns.Harmonizable'),
        value: (item) => isHarmonizable(item),
        cell: (value) => (value ? <AppIcon icon={faCheck} /> : undefined),
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
      }),
    c({
      id: 'location',
      header: t('Organizer.Columns.Location'),
      value: (item) => item.owner,
      cell: (_val, item) => <StoreLocation storeId={item.owner} />,
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
              loadouts={_.sortBy(
                inloadouts.map((l) => l.loadout),
                (l) => l.name,
              )}
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
    }),
    c({
      id: 'notes',
      header: t('Organizer.Columns.Notes'),
      value: (item) => getNotes(item) ?? '',
      cell: (_val, item) => <NotesArea item={item} minimal={true} />,
      gridWidth: 'minmax(200px, 1fr)',
      filter: (value) => `notes:${quoteFilterString(value)}`,
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
            <a data-perk-name={loadout.id}>
              {isInGameLoadout(loadout) && <InGameLoadoutIcon loadout={loadout} />}
              {loadout.name}
            </a>
          ) : (
            <a
              data-perk-name={loadout.id}
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
  traitsOnly,
  onPlugClicked,
}: {
  item: DimItem;
  traitsOnly?: boolean;
  onPlugClicked?: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void;
}) {
  if (!item.sockets) {
    return null;
  }

  let sockets = [];
  // Don't extract intrinsic, since there's a separate column
  const { modSocketsByCategory, perks } = getDisplayedItemSockets(
    item,
    /* excludeEmptySockets */ true,
  )!;

  if (perks) {
    sockets.push(...getSocketsByIndexes(item.sockets, perks.socketIndexes));
  }
  if (traitsOnly) {
    sockets = sockets.filter(
      (s) =>
        s.plugged &&
        (s.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Frames ||
          s.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Intrinsics),
    );
  } else {
    // Improve this when we use iterator-helpers
    sockets.push(...[...modSocketsByCategory.values()].flat());
  }

  sockets = sockets.filter(
    (s) =>
      // we have a separate column for the kill tracker
      !isKillTrackerSocket(s) &&
      // and for the regular weapon masterworks
      s.socketDefinition.socketTypeHash !== weaponMasterworkY2SocketTypeHash,
  );

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
                data-perk-name={p.plugDef.displayProperties.name}
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
                  <div className={styles.modPerk} data-perk-name={p.name}>
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
