import { DestinyVersion, TagValue } from '@destinyitemmanager/dim-api-types';
import { StoreIcon } from 'app/character-tile/StoreIcon';
import { StatInfo } from 'app/compare/Compare';
import BungieImage from 'app/dim-ui/BungieImage';
import { StatTotalToggle } from 'app/dim-ui/CustomStatTotal';
import ElementIcon from 'app/dim-ui/ElementIcon';
import { KillTrackerInfo } from 'app/dim-ui/KillTracker';
import PressTip from 'app/dim-ui/PressTip';
import { SpecialtyModSlotIcon } from 'app/dim-ui/SpecialtyModSlotIcon';
import { t, tl } from 'app/i18next-t';
import { getNotes, getTag, ItemInfos, tagConfig } from 'app/inventory/dim-item-info';
import { D1Item, DimItem, DimSocket, DimSocketCategory } from 'app/inventory/item-types';
import ItemIcon, { DefItemIcon } from 'app/inventory/ItemIcon';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import NewItemIndicator from 'app/inventory/NewItemIndicator';
import { storesSelector } from 'app/inventory/selectors';
import { source } from 'app/inventory/spreadsheets';
import { getEvent, getSeason } from 'app/inventory/store/season';
import { statAllowList } from 'app/inventory/store/stats';
import { getStore } from 'app/inventory/stores-helpers';
import TagIcon from 'app/inventory/TagIcon';
import { ItemStatValue } from 'app/item-popup/ItemStat';
import NotesArea from 'app/item-popup/NotesArea';
import { DimPlugTooltip } from 'app/item-popup/PlugTooltip';
import RecoilStat, { recoilValue } from 'app/item-popup/RecoilStat';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { CUSTOM_TOTAL_STAT_HASH } from 'app/search/d2-known-values';
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
import { compareBy } from 'app/utils/comparators';
import {
  getInterestingSocketMetadatas,
  getItemDamageShortName,
  getItemKillTrackerInfo,
  getItemYear,
  getMasterworkStatNames,
  isD1Item,
  isKillTrackerSocket,
  isSunset,
} from 'app/utils/item-utils';
import {
  getSocketsByIndexes,
  getWeaponArchetype,
  getWeaponArchetypeSocket,
  isEmptyArmorModSocket,
  isUsedArmorModSocket,
} from 'app/utils/socket-utils';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { D2EventInfo } from 'data/d2/d2-event-info';
import { ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './ItemTable.m.scss';
import { ColumnDefinition, ColumnGroup, SortDirection } from './table-types';

/**
 * Get the ID used to select whether this column is shown or not.
 */
export function getColumnSelectionId(column: ColumnDefinition) {
  return column.columnGroup ? column.columnGroup.id : column.id;
}

// Some stat labels are long. This lets us replace them with i18n
export const statLabels: Record<number, string | undefined> = {
  [StatHashes.RoundsPerMinute]: tl('Organizer.Stats.RPM'),
  [StatHashes.ReloadSpeed]: tl('Organizer.Stats.Reload'), // Reload Speed
  [StatHashes.AimAssistance]: tl('Organizer.Stats.Aim'), // Aim Assistance
  [StatHashes.RecoilDirection]: tl('Organizer.Stats.Recoil'), // Recoil Direction
  [StatHashes.InventorySize]: tl('Organizer.Stats.Inventory'), // Inventory Size
  [StatHashes.Attack]: tl('Organizer.Stats.Power'), // Inventory Size
  [StatHashes.Defense]: tl('Organizer.Stats.Power'), // Inventory Size
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
  classType: DestinyClass,
  itemInfos: ItemInfos,
  wishList: (item: DimItem) => InventoryWishListRoll | undefined,
  hasWishList: boolean,
  customTotalStat: number[],
  loadouts: Loadout[],
  newItems: Set<string>,
  destinyVersion: DestinyVersion,
  onPlugClicked: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void
): ColumnDefinition[] {
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
    _.compact(
      _.map(statHashes, (statInfo, statHashStr): ColumnWithStat | undefined => {
        const statHash = parseInt(statHashStr, 10);
        if (statHash === CUSTOM_TOTAL_STAT_HASH) {
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
          filter: (value) => `stat:${_.invert(statHashByName)[statHash]}:>=${value}`,
        };
      })
    ),
    (s) => statAllowList.indexOf(s.statHash)
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
            const value = stat.base;
            return (
              <div className={clsx(styles.statValue)}>
                {value}
                {column.statHash === StatHashes.RecoilDirection && <RecoilStat value={value} />}
              </div>
            );
          },
          filter: (value) => `basestat:${_.invert(statHashByName)[column.statHash]}:>=${value}`,
        }))
      : [];

  const d1ArmorQualityByStat =
    destinyVersion === 1 && isArmor
      ? _.sortBy(
          _.map(statHashes, (statInfo, statHashStr): ColumnWithStat => {
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
          (s) => statAllowList.indexOf(s.statHash)
        )
      : [];

  const columns: ColumnDefinition[] = _.compact([
    {
      id: 'icon',
      header: t('Organizer.Columns.Icon'),
      value: (i) => i.icon,
      cell: (_val, item) => (
        <ItemPopupTrigger item={item}>
          {(ref, onClick) => (
            <div ref={ref} onClick={onClick} className="item">
              <ItemIcon item={item} className={styles.itemIcon} />
            </div>
          )}
        </ItemPopupTrigger>
      ),
      noSort: true,
      noHide: true,
    },
    {
      id: 'name',
      header: t('Organizer.Columns.Name'),
      value: (i) => i.name,
      filter: (name: string) => `name:${quoteFilterString(name)}`,
    },
    !isGhost && {
      id: 'power',
      header: <AppIcon icon={powerIndicatorIcon} />,
      value: (item) => item.power,
      defaultSort: SortDirection.DESC,
      filter: (value) => `power:>=${value}`,
    },
    !isGhost &&
      destinyVersion === 2 && {
        id: 'sunset',
        header: t('Stats.Sunset'),
        value: isSunset,
        defaultSort: SortDirection.ASC,
        cell: (value) => (value ? <AppIcon icon={faCheck} /> : undefined),
        filter: (value) => (value ? 'is:sunset' : '-is:sunset'),
      },
    !isGhost &&
      (destinyVersion === 2 || isWeapon) && {
        id: 'dmg',
        header: isArmor ? t('Organizer.Columns.Element') : t('Organizer.Columns.Damage'),
        value: (item) => item.element?.displayProperties.name,
        cell: (_val, item) => <ElementIcon className={styles.inlineIcon} element={item.element} />,
        filter: (_val, item) => `is:${getItemDamageShortName(item)}`,
      },
    isArmor &&
      destinyVersion === 2 && {
        id: 'energy',
        header: t('Organizer.Columns.Energy'),
        value: (item) => item.energy?.energyCapacity,
        defaultSort: SortDirection.DESC,
        filter: (value) => `energycapacity:>=${value}`,
      },
    {
      id: 'locked',
      header: <AppIcon icon={lockIcon} />,
      value: (i) => i.locked,
      cell: (value) => (value ? <AppIcon icon={lockIcon} /> : undefined),
      defaultSort: SortDirection.DESC,
      filter: (value) => (value ? 'is:locked' : 'not:locked'),
    },
    {
      id: 'tag',
      header: t('Organizer.Columns.Tag'),
      value: (item) => getTag(item, itemInfos),
      cell: (value: TagValue) => <TagIcon tag={value} />,
      sort: compareBy((tag: TagValue) => (tag && tagConfig[tag] ? tagConfig[tag].sortOrder : 1000)),
      filter: (value) => `tag:${value || 'none'}`,
    },
    {
      id: 'new',
      header: t('Organizer.Columns.New'),
      value: (item) => newItems.has(item.id),
      cell: (value) => (value ? <NewItemIndicator /> : undefined),
      defaultSort: SortDirection.DESC,
      filter: (value) => (value ? 'is:new' : 'not:new'),
    },
    {
      id: 'recency',
      header: t('Organizer.Columns.Recency'),
      value: (item) => item.id,
      cell: () => '',
    },
    destinyVersion === 2 &&
      isWeapon && {
        id: 'wishList',
        header: t('Organizer.Columns.WishList'),
        value: (item) => {
          const roll = wishList(item);
          return roll ? (roll.isUndesirable ? false : true) : undefined;
        },
        cell: (value) =>
          value !== undefined ? (
            <AppIcon
              icon={value ? thumbsUpIcon : thumbsDownIcon}
              className={value ? styles.positive : styles.negative}
            />
          ) : undefined,
        sort: compareBy((wishList) => (wishList === undefined ? 0 : wishList === true ? -1 : 1)),
        filter: (value) =>
          value === true ? 'is:wishlist' : value === false ? 'is:trashlist' : 'not:wishlist',
      },
    {
      id: 'tier',
      header: t('Organizer.Columns.Tier'),
      value: (i) => i.tier,
      filter: (value) => `is:${value}`,
    },
    destinyVersion === 2 && {
      id: 'source',
      header: t('Organizer.Columns.Source'),
      value: source,
      filter: (value) => `source:${value}`,
    },
    {
      id: 'year',
      header: t('Organizer.Columns.Year'),
      value: (item) => getItemYear(item),
      filter: (value) => `year:${value}`,
    },
    destinyVersion === 2 && {
      id: 'season',
      header: t('Organizer.Columns.Season'),
      value: (i) => getSeason(i),
      filter: (value) => `season:${value}`,
    },
    destinyVersion === 2 && {
      id: 'event',
      header: t('Organizer.Columns.Event'),
      value: (item) => {
        const event = getEvent(item);
        return event ? D2EventInfo[event].name : undefined;
      },
      filter: (value) => `event:${value}`,
    },
    destinyVersion === 2 &&
      isArmor && {
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
        filter: (value: string) =>
          value !== undefined
            ? value
                .split(',')
                .map((m) => `modslot:${m}`)
                .join(' ')
            : ``,
      },
    destinyVersion === 1 && {
      id: 'percentComplete',
      header: t('Organizer.Columns.PercentComplete'),
      value: (item) => item.percentComplete,
      cell: (value: number) => percent(value),
      filter: (value) => `percentage:>=${value}`,
    },
    destinyVersion === 2 &&
      isWeapon && {
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
        filter: (value: string) => `perkname:${quoteFilterString(value)}`,
      },
    (destinyVersion === 2 || isWeapon) && {
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
    },
    {
      id: 'perks',
      header: t('Organizer.Columns.Perks'),
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
        typeof value === 'string' ? `perkname:${quoteFilterString(value)}` : undefined,
    },
    {
      id: 'mods',
      header: t('Organizer.Columns.Mods'),
      value: () => 0,
      // cell: (_val, item) =>
      //   isD1Item(item) ? (
      //     <D1ModsCell item={item} />
      //   ) : (
      //     <ModsCell item={item} onPlugClicked={onPlugClicked} />
      //   ),
      cell: (_val, item) => <ModsCell item={item} onPlugClicked={onPlugClicked} />,
      noSort: true,
      filter: (value) =>
        typeof value === 'string' ? `perkname:${quoteFilterString(value)}` : undefined,
    },
    {
      id: 'shaders', // maybe better as 'shader'?
      header: t('Organizer.Columns.Shaders'),
      value: () => 0,
      // cell: (_val, item) =>
      //   isD1Item(item) ? (
      //     <D1ShadersCell item={item} />
      //   ) : (
      //     <ShadersCell item={item} onPlugClicked={onPlugClicked} />
      //   ),
      cell: (_val, item) => <ShadersCell item={item} onPlugClicked={onPlugClicked} />,
      noSort: true,
      filter: (value) =>
        typeof value === 'string' ? `perkname:${quoteFilterString(value)}` : undefined,
    },
    destinyVersion === 2 &&
      isWeapon && {
        id: 'traits',
        header: t('Organizer.Columns.Traits'),
        value: () => 0, // TODO: figure out a way to sort perks
        cell: (_val, item) => (
          <PerksCell item={item} traitsOnly={true} onPlugClicked={onPlugClicked} />
        ),
        noSort: true,
        gridWidth: 'minmax(180px,max-content)',
        filter: (value) =>
          typeof value === 'string' ? `perkname:${quoteFilterString(value)}` : undefined,
      },
    ...statColumns,
    ...baseStatColumns,
    ...d1ArmorQualityByStat,
    destinyVersion === 1 &&
      isArmor && {
        id: 'quality',
        header: t('Organizer.Columns.Quality'),
        value: (item) => (isD1Item(item) && item.quality ? item.quality.min : 0),
        cell: (value: number) => <span style={getColor(value, 'color')}>{value}%</span>,
        filter: (value) => `quality:>=${value}`,
      },
    destinyVersion === 2 &&
      isArmor && {
        id: 'customstat',
        header: (
          <>
            {t('Organizer.Columns.CustomTotal')}
            <StatTotalToggle forClass={classType} readOnly={true} />
          </>
        ),
        value: (item) =>
          _.sumBy(item.stats, (s) => (customTotalStat.includes(s.statHash) ? s.base : 0)),
        defaultSort: SortDirection.DESC,
        filter: (value) => `stat:custom:>=${value}`,
      },
    destinyVersion === 2 &&
      isWeapon && {
        id: 'masterworkTier',
        header: t('Organizer.Columns.MasterworkTier'),
        value: (item) => item.masterworkInfo?.tier,
        defaultSort: SortDirection.DESC,
        filter: (value) => `masterwork:>=${value}`,
      },
    destinyVersion === 2 &&
      isWeapon && {
        id: 'masterworkStat',
        header: t('Organizer.Columns.MasterworkStat'),
        value: (item) => getMasterworkStatNames(item.masterworkInfo),
      },
    destinyVersion === 2 &&
      isWeapon && {
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
      },
    {
      id: 'location',
      header: t('Organizer.Columns.Location'),
      value: (item) => item.owner,
      cell: (_val, item) => <StoreLocation storeId={item.owner} />,
    },
    {
      id: 'loadouts',
      header: t('Organizer.Columns.Loadouts'),
      value: () => 0,
      cell: (_val, item) => {
        // Accessing id is safe: Organizer is only weapons and armor
        const inloadouts = loadouts.filter((l) => l.items.some((i) => i.id === item.id));
        return (
          inloadouts.length > 0 &&
          inloadouts.map((loadout) => <div key={loadout.id}>{loadout.name}</div>)
        );
      },
      noSort: true,
    },
    {
      id: 'notes',
      header: t('Organizer.Columns.Notes'),
      value: (item) => getNotes(item, itemInfos),
      cell: (_val, item) => <NotesArea item={item} minimal={true} />,
      gridWidth: 'minmax(200px, 1fr)',
      filter: (value: string) => `notes:${quoteFilterString(value)}`,
    },
    isWeapon &&
      hasWishList && {
        id: 'wishListNote',
        header: t('Organizer.Columns.WishListNotes'),
        value: (item) => wishList(item)?.notes?.trim() ?? '',
        gridWidth: 'minmax(200px, 1fr)',
        filter: (value: string) => `wishlistnotes:${quoteFilterString(value)}`,
      },
  ]);

  return columns;
}

function PerksCell({
  item,
  traitsOnly,
  onPlugClicked,
}: {
  item: DimItem;
  traitsOnly?: boolean;
  onPlugClicked?(value: { item: DimItem; socket: DimSocket; plugHash: number }): void;
}) {
  if (!item.sockets) {
    return null;
  }
  const perks = item.sockets.categories.filter(
    (c) =>
      c.category.displayProperties.name !== 'WEAPON MODS' &&
      c.category.displayProperties.name !== 'WEAPON COSMETICS'
  );
  let sockets = getSockets(item, perks);

  if (traitsOnly) {
    sockets = sockets.filter(
      (s) =>
        s.plugged &&
        (s.plugged.plugDef.plug.plugCategoryIdentifier === 'frames' ||
          s.plugged.plugDef.plug.plugCategoryIdentifier === 'intrinsics')
    );
  }

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
                </div>{' '}
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
    _.groupBy(
      item.talentGrid.nodes.filter((n) => n.column > 0),
      (n) => n.column
    )
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
                      <h2>{p.name}</h2>
                      <div>{p.description}</div>
                    </>
                  }
                >
                  <div className={styles.modPerk} data-perk-name={p.name}>
                    <BungieImage src={p.icon} /> {p.name}
                    {(!p.unlocked || p.xp < p.xpRequired) && <> ({percent(p.xp / p.xpRequired)})</>}
                  </div>
                </PressTip>
              )
          )}
        </div>
      ))}
    </>
  );
}

function ModsCell({
  item,
  onPlugClicked,
}: {
  item: DimItem;
  onPlugClicked?(value: { item: DimItem; socket: DimSocket; plugHash: number }): void;
}) {
  if (!item.sockets) {
    return null;
  }

  const mods = item.sockets.categories.filter(
    (c) => c.category.displayProperties.name === 'WEAPON MODS'
  );
  const sockets = getSockets(item, mods);

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
          {socket.plugOptions.map((m) => (
            <PressTip key={m.plugDef.hash} tooltip={() => <DimPlugTooltip item={item} plug={m} />}>
              <div
                className={clsx(styles.modPerk, {
                  [styles.perkSelected]:
                    socket.isPerk && socket.plugOptions.length > 1 && m === socket.plugged,
                  [styles.perkSelectable]: socket.plugOptions.length > 1,
                })}
                data-perk-name={m.plugDef.displayProperties.name}
                onClick={
                  onPlugClicked && socket.plugOptions.length > 1
                    ? (e: React.MouseEvent) => {
                        if (!e.shiftKey) {
                          e.stopPropagation();
                          onPlugClicked({ item, socket, plugHash: m.plugDef.hash });
                        }
                      }
                    : undefined
                }
              >
                <div className={styles.miniPerkContainer}>
                  <DefItemIcon itemDef={m.plugDef} borderless={true} />
                </div>{' '}
                {m.plugDef.displayProperties.name}
              </div>
            </PressTip>
          ))}
        </div>
      ))}
    </>
  );
}

// TODO: CosmeticCell might make more sense
function ShadersCell({
  item,
  onPlugClicked,
}: {
  item: DimItem;
  onPlugClicked?(value: { item: DimItem; socket: DimSocket; plugHash: number }): void;
}) {
  if (!item.sockets) {
    return null;
  }

  const shaders = item.sockets.categories.filter(
    (c) => c.category.displayProperties.name === 'WEAPON COSMETICS'
  );
  const sockets = getSockets(item, shaders);

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
          data-socket-name={
            socket.plugged?.plugDef.displayProperties.name === 'WEAPON COSMETICS' ??
            socket.plugged?.plugDef.displayProperties.name
          }
        >
          {socket.plugOptions.map((s) => (
            <PressTip key={s.plugDef.hash} tooltip={() => <DimPlugTooltip item={item} plug={s} />}>
              <div
                className={clsx(styles.modPerk, {
                  [styles.perkSelected]:
                    socket.isPerk && socket.plugOptions.length > 1 && s === socket.plugged,
                  [styles.perkSelectable]: socket.plugOptions.length > 1,
                })}
                data-perk-name={s.plugDef.displayProperties.name}
                onClick={
                  onPlugClicked && socket.plugOptions.length > 1
                    ? (e: React.MouseEvent) => {
                        if (!e.shiftKey) {
                          e.stopPropagation();
                          onPlugClicked({ item, socket, plugHash: s.plugDef.hash });
                        }
                      }
                    : undefined
                }
              >
                <div className={styles.miniPerkContainer}>
                  <DefItemIcon itemDef={s.plugDef} borderless={true} />
                </div>{' '}
                {s.plugDef.displayProperties.name}
              </div>
            </PressTip>
          ))}
        </div>
      ))}
    </>
  );
}

function getSockets(item: DimItem, category: DimSocketCategory[]) {
  return category.flatMap((c) =>
    getSocketsByIndexes(item.sockets!, c.socketIndexes).filter(
      (s) =>
        !isKillTrackerSocket(s) &&
        !isEmptyArmorModSocket(s) &&
        s.plugged?.plugDef.displayProperties.name && // ignore empty sockets and unnamed plugs
        (s.plugged.plugDef.collectibleHash || // collectibleHash catches shaders and most mods
          isUsedArmorModSocket(s) || // but we catch additional mods missing collectibleHash (arrivals)
          (s.isPerk &&
            (item.isExotic || // ignore archetype if it's not exotic
              !s.plugged.plugDef.itemCategoryHashes?.includes(
                ItemCategoryHashes.WeaponModsIntrinsic
              ))))
    )
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
