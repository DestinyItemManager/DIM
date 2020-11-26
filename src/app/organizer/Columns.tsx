import { DestinyVersion, TagValue } from '@destinyitemmanager/dim-api-types';
import { StoreIcon } from 'app/character-tile/StoreIcon';
import { StatInfo } from 'app/compare/Compare';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import { StatTotalToggle } from 'app/dim-ui/CustomStatTotal';
import ElementIcon from 'app/dim-ui/ElementIcon';
import { KillTrackerInfo } from 'app/dim-ui/KillTracker';
import PressTip from 'app/dim-ui/PressTip';
import SpecialtyModSlotIcon from 'app/dim-ui/SpecialtyModSlotIcon';
import { getWeaponArchetype, getWeaponArchetypeSocket } from 'app/dim-ui/WeaponArchetype';
import { t } from 'app/i18next-t';
import { getNotes, getTag, ItemInfos, tagConfig } from 'app/inventory/dim-item-info';
import { D1Item, DimItem } from 'app/inventory/item-types';
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
import itemStatStyle from 'app/item-popup/ItemStat.m.scss';
import NotesArea from 'app/item-popup/NotesArea';
import PlugTooltip from 'app/item-popup/PlugTooltip';
import { Loadout } from 'app/loadout/loadout-types';
import { CUSTOM_TOTAL_STAT_HASH } from 'app/search/d2-known-values';
import { statHashByName } from 'app/search/search-filter-values';
import { getColor, percent } from 'app/shell/filters';
import {
  AppIcon,
  lockIcon,
  powerIndicatorIcon,
  thumbsDownIcon,
  thumbsUpIcon,
} from 'app/shell/icons';
import { RootState } from 'app/store/types';
import { compareBy } from 'app/utils/comparators';
import {
  getItemDamageShortName,
  getItemKillTrackerInfo,
  getItemPowerCapFinalSeason,
  getItemYear,
  getMasterworkStatNames,
  getSpecialtySocketMetadatas,
  isD1Item,
} from 'app/utils/item-utils';
import { isUsedModSocket } from 'app/utils/socket-utils';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { D2EventInfo } from 'data/d2/d2-event-info';
import { ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
/* eslint-disable react/jsx-key, react/prop-types */
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './ItemTable.m.scss';
import { ColumnDefinition, ColumnGroup, SortDirection } from './table-types';

/**
 * Get the ID used to select whether this column is shown or not.
 */
export function getColumnSelectionId(column: ColumnDefinition) {
  return column.columnGroup ? column.columnGroup.id : column.id;
}

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
  defs: D2ManifestDefinitions,
  itemInfos: ItemInfos,
  wishList: {
    [key: string]: InventoryWishListRoll;
  },
  customTotalStat: number[],
  loadouts: Loadout[],
  newItems: Set<string>,
  destinyVersion: DestinyVersion
): ColumnDefinition[] {
  const hasWishList = !_.isEmpty(wishList);

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

  // Some stat labels are long. This lets us replace them with i18n
  const statLabels = {
    [StatHashes.RoundsPerMinute]: t('Organizer.Stats.RPM'),
    [StatHashes.ReloadSpeed]: t('Organizer.Stats.Reload'), // Reload Speed
    [StatHashes.AimAssistance]: t('Organizer.Stats.Aim'), // Aim Assistance
    [StatHashes.RecoilDirection]: t('Organizer.Stats.Recoil'), // Recoil Direction
    [StatHashes.InventorySize]: t('Organizer.Stats.Inventory'), // Inventory Size
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
        return {
          id: `stat${statHash}`,
          header: statInfo.displayProperties.hasIcon ? (
            <span title={statInfo.displayProperties.name}>
              <BungieImage src={statInfo.displayProperties.icon} />
            </span>
          ) : (
            statLabels[statHash] || statInfo.displayProperties.name
          ),
          statHash,
          columnGroup: statsGroup,
          value: (item: DimItem) => item.stats?.find((s) => s.statHash === statHash)?.value,
          cell: (_, item: DimItem) => {
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
          id: `base_${column.statHash}`,
          columnGroup: baseStatsGroup,
          value: (item: DimItem) => item.stats?.find((s) => s.statHash === column.statHash)?.base,
          cell: (value) => <div className={itemStatStyle.value}>{value}</div>,
          filter: (value) => `basestat:${_.invert(statHashByName)[column.statHash]}:>=${value}`,
        }))
      : [];

  const d1ArmorQualityByStat =
    destinyVersion === 1 && isArmor
      ? _.sortBy(
          _.map(
            statHashes,
            (statInfo, statHashStr): ColumnWithStat => {
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
                    <span style={getColor(stat?.qualityPercentage?.min || 0, 'color')}>
                      {value}%
                    </span>
                  );
                },
              };
            }
          ),
          (s) => statAllowList.indexOf(s.statHash)
        )
      : [];

  const columns: ColumnDefinition[] = _.compact([
    {
      id: 'icon',
      header: t('Organizer.Columns.Icon'),
      value: (i) => i.icon,
      cell: (_, item) => (
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
      filter: (name) => `name:"${name}"`,
    },
    !isGhost && {
      id: 'power',
      header: <AppIcon icon={powerIndicatorIcon} />,
      value: (item) => item.primStat?.value,
      defaultSort: SortDirection.DESC,
      filter: (value) => `power:>=${value}`,
    },
    !isGhost &&
      destinyVersion === 2 && {
        id: 'maxpower',
        header: t('Stats.PowerCap'),
        value: (item) => item.powerCap,
        cell: (value, item) =>
          value && (
            <>
              {t('Stats.PowerCapWithSeason', {
                powerCap: value,
                finalSeason: getItemPowerCapFinalSeason(item),
              })}
            </>
          ),
        defaultSort: SortDirection.DESC,
        filter: (value) => (value ? `powerlimit:=${value}` : undefined),
        gridWidth: 'minmax(max-content,max-content)',
      },
    !isGhost &&
      (destinyVersion === 2 || isWeapon) && {
        id: 'dmg',
        header: isArmor ? t('Organizer.Columns.Element') : t('Organizer.Columns.Damage'),
        value: (item) => item.element?.displayProperties.name,
        cell: (_, item) => <ElementIcon className={styles.inlineIcon} element={item.element} />,
        filter: (_, item) => `is:${getItemDamageShortName(item)}`,
      },
    isArmor &&
      destinyVersion === 2 && {
        id: 'energy',
        header: t('Organizer.Columns.Energy'),
        value: (item) => item.energy?.energyCapacity,
        defaultSort: SortDirection.DESC,
        filter: (value) => `energycapacity>=:${value}`,
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
    destinyVersion === 2 &&
      isWeapon &&
      hasWishList && {
        id: 'wishList',
        header: t('Organizer.Columns.WishList'),
        value: (item) => {
          const roll = wishList[item.id];
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
          getSpecialtySocketMetadatas(item)
            ?.map((m) => m.slotTag)
            .join(','),
        cell: (value, item) =>
          value && (
            <SpecialtyModSlotIcon
              className={styles.modslotIcon}
              item={item}
              showAllSupportedSeasons={true}
            />
          ),
        filter: (_, item) => {
          const modSlotMetadata = getSpecialtySocketMetadatas(item);
          return `modslot:${modSlotMetadata?.[0].slotTag || 'none'}`;
        },
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
        cell: (_val, item) => (
          <div>
            {_.compact([getWeaponArchetypeSocket(item)?.plugged]).map((p) => (
              <PressTip
                key={p.plugDef.hash}
                tooltip={<PlugTooltip item={item} plug={p} defs={defs} />}
              >
                <div className={styles.modPerk}>
                  <div className={styles.miniPerkContainer}>
                    <DefItemIcon itemDef={p.plugDef} defs={defs} borderless={true} />
                  </div>{' '}
                  {p.plugDef.displayProperties.name}
                </div>
              </PressTip>
            ))}
          </div>
        ),
        filter: (value) => `perkname:"${value}"`,
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
      filter: (_, item) => `is:${getItemDamageShortName(item)}`,
    },
    {
      id: 'perks',
      header:
        destinyVersion === 2 ? t('Organizer.Columns.PerksMods') : t('Organizer.Columns.Perks'),
      value: () => 0, // TODO: figure out a way to sort perks
      cell: (_, item) =>
        isD1Item(item) ? <D1PerksCell item={item} /> : <PerksCell defs={defs} item={item} />,
      noSort: true,
      gridWidth: 'minmax(324px,max-content)',
      filter: (value) => (value !== 0 ? `perkname:"${value}"` : undefined),
    },
    destinyVersion === 2 &&
      isWeapon && {
        id: 'traits',
        header: t('Organizer.Columns.Traits'),
        value: () => 0, // TODO: figure out a way to sort perks
        cell: (_, item) => <PerksCell defs={defs} item={item} traitsOnly={true} />,
        noSort: true,
        gridWidth: 'minmax(180px,max-content)',
        filter: (value) => (value !== 0 ? `perkname:"${value}"` : undefined),
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
        cell: (_, item) => {
          const killTrackerInfo = getItemKillTrackerInfo(item);
          return (
            killTrackerInfo && (
              <KillTrackerInfo tracker={killTrackerInfo} defs={defs} className={styles.modPerk} />
            )
          );
        },
        defaultSort: SortDirection.DESC,
      },
    {
      id: 'location',
      header: t('Organizer.Columns.Location'),
      value: (item) => item.owner,
      cell: (_, item) => <StoreLocation storeId={item.owner} />,
    },
    {
      id: 'loadouts',
      header: t('Organizer.Columns.Loadouts'),
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
      noSort: true,
    },
    {
      id: 'notes',
      header: t('Organizer.Columns.Notes'),
      value: (item) => getNotes(item, itemInfos),
      cell: (_, item) => <NotesArea item={item} minimal={true} />,
      gridWidth: 'minmax(200px, 1fr)',
      filter: (value) => `notes:"${value}"`,
    },
    isWeapon &&
      hasWishList && {
        id: 'wishListNote',
        header: t('Organizer.Columns.WishListNotes'),
        value: (item) => wishList?.[item.id]?.notes,
        gridWidth: 'minmax(200px, 1fr)',
        filter: (value) => `wishlistnotes:"${value}"`,
      },
  ]);

  return columns;
}

function PerksCell({
  defs,
  item,
  traitsOnly,
}: {
  defs: D2ManifestDefinitions;
  item: DimItem;
  traitsOnly?: boolean;
}) {
  if (!item.sockets) {
    return null;
  }

  let sockets = item.sockets.categories.flatMap((c) =>
    c.sockets.filter(
      (s) =>
        s.plugged && // ignore empty sockets
        s.plugOptions.length > 0 &&
        (s.plugged.plugDef.collectibleHash || // collectibleHash catches shaders and most mods
          isUsedModSocket(s) || // but we catch additional mods missing collectibleHash (arrivals)
          (s.isPerk &&
            (item.isExotic || // ignore archetype if it's not exotic
              !s.plugged.plugDef.itemCategoryHashes?.includes(
                ItemCategoryHashes.WeaponModsIntrinsic
              ))))
    )
  );

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
            <PressTip
              key={p.plugDef.hash}
              tooltip={<PlugTooltip item={item} plug={p} defs={defs} />}
            >
              <div
                className={clsx(styles.modPerk, {
                  [styles.perkSelected]:
                    socket.isPerk && socket.plugOptions.length > 1 && p === socket.plugged,
                })}
                data-perk-name={p.plugDef.displayProperties.name}
              >
                <div className={styles.miniPerkContainer}>
                  <DefItemIcon itemDef={p.plugDef} defs={defs} borderless={true} />
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

function StoreLocation({ storeId }: { storeId: string }) {
  const store = useSelector((state: RootState) => getStore(storesSelector(state), storeId)!);

  return (
    <div className={styles.locationCell}>
      <StoreIcon store={store} /> {store.className}
    </div>
  );
}
