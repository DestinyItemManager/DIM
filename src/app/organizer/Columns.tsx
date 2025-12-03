import { CustomStatDef, DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { StoreIcon } from 'app/character-tile/StoreIcon';
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
import { D1Item, DimItem, DimSocket, DimStat } from 'app/inventory/item-types';
import { storesSelector } from 'app/inventory/selectors';
import { isHarmonizable } from 'app/inventory/store/deepsight';
import { getEvent, getSeason } from 'app/inventory/store/season';
import { getStatSortOrder } from 'app/inventory/store/stats';
import { getStore } from 'app/inventory/stores-helpers';
import { KillTrackerInfo } from 'app/item-popup/KillTracker';
import NotesArea from 'app/item-popup/NotesArea';
import { DimPlugTooltip } from 'app/item-popup/PlugTooltip';
import { recoilValue } from 'app/item-popup/RecoilStat';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import InGameLoadoutIcon from 'app/loadout/ingame/InGameLoadoutIcon';
import { InGameLoadout, Loadout, isInGameLoadout } from 'app/loadout/loadout-types';
import { LoadoutsByItem } from 'app/loadout/selectors';
import {
  TOTAL_STAT_HASH,
  breakerTypeNames,
  realD2ArmorStatSearchByHash,
} from 'app/search/d2-known-values';
import D2Sources from 'app/search/items/search-filters/d2-sources';
import { quoteFilterString } from 'app/search/query-parser';
import { statHashByName } from 'app/search/search-filter-values';
import { getD1QualityColor, percent } from 'app/shell/formatters';
import {
  AppIcon,
  faCheck,
  lockIcon,
  powerIndicatorIcon,
  thumbsDownIcon,
  thumbsUpIcon,
} from 'app/shell/icons';
import { RootState } from 'app/store/types';
import { compact, filterMap, invert } from 'app/utils/collections';
import { Comparator, compareBy, primitiveComparator } from 'app/utils/comparators';
import {
  getArmor3StatFocus,
  getArmor3TuningStat,
  getItemDamageShortName,
  getItemKillTrackerInfo,
  getItemYear,
  getMasterworkStatNames,
  getSpecialtySocketMetadata,
  isArmor3,
  isArtifice,
  isArtificeSocket,
  isD1Item,
} from 'app/utils/item-utils';
import {
  getArmorArchetype,
  getArmorArchetypeSocket,
  getExtraIntrinsicPerkSockets,
  getIntrinsicArmorPerkSocket,
  getSocketsByType,
  getWeaponArchetype,
  getWeaponArchetypeSocket,
  isEnhancedPerk,
} from 'app/utils/socket-utils';
import { LookupTable } from 'app/utils/util-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import clsx from 'clsx';
import { D2EventInfo } from 'data/d2/d2-event-info-v2';
import { BreakerTypeHashes, BucketHashes, StatHashes } from 'data/d2/generated-enums';
import shapedOverlay from 'images/shapedOverlay.png';
import React from 'react';
import { useSelector } from 'react-redux';
import { createCustomStatColumns } from './CustomStatColumns';

import CompareStat from 'app/compare/CompareStat';
import {
  buildNodeNames,
  buildSocketNames,
  csvStatNamesForDestinyVersion,
} from 'app/inventory/spreadsheets';
import { PlugClickedHandler } from 'app/inventory/store/override-sockets';
import { AmmoIcon } from 'app/item-popup/AmmoIcon';
import { DeepsightHarmonizerIcon, HarmonizerIcon } from 'app/item-popup/DeepsightHarmonizerIcon';
import ItemSockets from 'app/item-popup/ItemSockets';
import { ItemModSockets } from 'app/item-popup/ItemSocketsWeapons';
import ItemTalentGrid from 'app/item-popup/ItemTalentGrid';
import { ammoTypeFilter } from 'app/search/items/search-filters/known-values';
import { emptyArray } from 'app/utils/empty';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import * as styles from './Columns.m.scss';
import { ColumnDefinition, ColumnGroup, ColumnWithStat, SortDirection, Value } from './table-types';

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
  [StatHashes.AmmoGeneration]: tl('Organizer.Stats.AmmoGeneration'),
};

export const perkStringSort: Comparator<string | undefined> = (a, b) => {
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
    // Disrupt normal alphabetization by making empty string (no interesting information) sort to last.
    // (the "both are blank" condition is already ruled out above)
    return !aPart ? 1 : !bPart ? -1 : (aPart.localeCompare(bPart) as 1 | 0 | -1);
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
 * This helper allows TypeScript to perform type inference to determine the
 * type of V based on its arguments. This allows us to automatically type the
 * various column methods like `cell` and `filter` automatically based on the
 * return type of `value`.
 */
/*@__INLINE__*/
function c<V extends Value>(columnDef: ColumnDefinition<V>): ColumnDefinition<V> {
  return columnDef;
}

export const d1QualityColumn = c({
  id: 'quality',
  header: t('Organizer.Columns.Quality'),
  csv: '% Quality',
  value: (item) => (isD1Item(item) && item.quality ? item.quality.min : 0),
  cell: (value) => <span style={getD1QualityColor(value)}>{value}%</span>,
  filter: (value) => `quality:>=${value}`,
});

export function modsColumn(
  className: string,
  headerClassName: string,
  isWeapon: boolean,
  onPlugClicked?: PlugClickedHandler,
) {
  return c({
    id: 'mods',
    className,
    headerClassName,
    header: t('Organizer.Columns.Mods'),
    // TODO: for ghosts this should return ghost mods, not cosmetics
    value: (item) => perkString(getSocketsByType(item, 'mods')),
    cell: (_val, item) => (
      <>
        {isD1Item(item) && item.talentGrid && (
          <ItemTalentGrid item={item} className={styles.talentGrid} perksOnly={true} />
        )}
        {item.sockets &&
          (isWeapon ? (
            <ItemModSockets item={item} onPlugClicked={onPlugClicked} />
          ) : (
            <ItemSockets item={item} minimal grid onPlugClicked={onPlugClicked} />
          ))}
      </>
    ),
    sort: perkStringSort,
  });
}

export function perksGridColumn(
  className: string,
  headerClassName: string,
  onPlugClicked: PlugClickedHandler | undefined,
  initialItemId?: string,
  headerKey: I18nKey = 'Organizer.Columns.Perks',
) {
  return c({
    id: 'perksGrid',
    className,
    headerClassName,
    header: t(headerKey),
    value: (item) => perkString(getSocketsByType(item, 'perks')),
    cell: (_val, item) => (
      <>
        {isD1Item(item) && item.talentGrid && (
          <ItemTalentGrid item={item} className={styles.talentGrid} perksOnly={true} />
        )}
        {item.missingSockets && item.id === initialItemId && (
          <div className="item-details warning">
            {item.missingSockets === 'missing'
              ? t('MovePopup.MissingSockets')
              : t('MovePopup.LoadingSockets')}
          </div>
        )}
        {item.sockets && <ItemSockets item={item} minimal grid onPlugClicked={onPlugClicked} />}
      </>
    ),
    sort: perkStringSort,
  });
}

/**
 * This function generates the columns.
 */
export function getColumns(
  useCase: 'organizer' | 'spreadsheet',
  itemsType: 'weapon' | 'armor' | 'ghost',
  /** A single example stat per stat hash among items */
  stats: DimStat[],
  getTag: (item: DimItem) => TagValue | undefined,
  getNotes: (item: DimItem) => string | undefined,
  wishList: (item: DimItem) => InventoryWishListRoll | undefined,
  hasWishList: boolean,
  customStatDefs: CustomStatDef[],
  loadoutsByItem: LoadoutsByItem,
  newItems: Set<string>,
  destinyVersion: DestinyVersion,
  onPlugClicked?: PlugClickedHandler,
): ColumnDefinition[] {
  const isGhost = itemsType === 'ghost';
  const isArmor = itemsType === 'armor';
  const isWeapon = itemsType === 'weapon';
  const isSpreadsheet = useCase === 'spreadsheet';

  const { statColumns, baseStatColumns, d1ArmorQualityByStat } = getStatColumns(
    stats,
    customStatDefs,
    destinyVersion,
    {
      isArmor,
      isSpreadsheet,
      className: styles.stats,
      headerClassName: styles.statsHeader,
    },
  );
  const customStats = isSpreadsheet
    ? []
    : createCustomStatColumns(customStatDefs, {
        className: styles.stats,
        headerClassName: styles.statsHeader,
      });

  const columns: ColumnDefinition[] = compact([
    !isSpreadsheet &&
      c({
        id: 'icon',
        header: t('Organizer.Columns.Icon'),
        className: styles.icon,
        headerClassName: styles.iconHeader,
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
      className: styles.name,
      headerClassName: styles.noWrap,
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
        className: styles.centered,
        headerClassName: styles.centered,
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
        className: styles.dmg,
        headerClassName: styles.dmgHeader,
        csv: 'Element',
        value: (item) => item.element?.displayProperties.name,
        cell: (_val, item) => <ElementIcon className={styles.inlineIcon} element={item.element} />,
        filter: (_val, item) => `is:${getItemDamageShortName(item)}`,
      }),
    isWeapon &&
      c({
        id: 'ammo',
        header: t('Organizer.Columns.Ammo'),
        className: styles.dmg,
        headerClassName: styles.dmgHeader,
        value: (item) => item.ammoType,
        cell: (_val, item) => <AmmoIcon className={styles.inlineIcon} type={item.ammoType} />,
        filter: (_val, item) => ammoTypeFilter.fromItem(item),
        csv: (_val, item) => ['Ammo', ammoTypeFilter.fromItem(item).replace('is:', '')],
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
        className: styles.centered,
        headerClassName: styles.centered,
        csv: 'Energy Capacity',
        value: (item) => item.energy?.energyCapacity,
        defaultSort: SortDirection.DESC,
        filter: (value) => `energycapacity:>=${value}`,
      }),
    c({
      id: 'locked',
      header: <AppIcon icon={lockIcon} />,
      csv: 'Locked',
      className: styles.centered,
      headerClassName: styles.centered,
      dropdownLabel: t('Organizer.Columns.Locked'),
      value: (i) => i.locked,
      cell: (value) => (value ? <AppIcon icon={lockIcon} /> : undefined),
      defaultSort: SortDirection.DESC,
      filter: (value) => `${value ? '' : '-'}is:locked`,
    }),
    c({
      id: 'tag',
      header: t('Organizer.Columns.Tag'),
      className: styles.centered,
      headerClassName: styles.centered,
      value: (item) => getTag(item) ?? '',
      cell: (value) => value && <TagIcon tag={value} />,
      sort: compareBy((tag) => (tag && tag in tagConfig ? tagConfig[tag].sortOrder : 1000)),
      filter: (value) => `tag:${value || 'none'}`,
      csv: (value) => ['Tag', value || undefined],
    }),
    !isSpreadsheet &&
      $featureFlags.newItems &&
      c({
        id: 'new',
        header: t('Organizer.Columns.New'),
        className: styles.new,
        headerClassName: styles.centered,
        value: (item) => newItems.has(item.id),
        cell: (value) => (value ? <NewItemIndicator /> : undefined),
        defaultSort: SortDirection.DESC,
        filter: (value) => `${value ? '' : '-'}is:new`,
      }),
    c({
      id: 'featured',
      header: t('Organizer.Columns.Featured'),
      className: styles.centered,
      headerClassName: styles.centered,
      defaultSort: SortDirection.DESC,
      value: (item) => item.featured,
      cell: (value) => value && <AppIcon icon={faCheck} />,
      filter: (value) => `${value ? '' : '-'}is:featured`,
      csv: 'New Gear',
    }),
    c({
      id: 'holofoil',
      header: t('Organizer.Columns.Holofoil'),
      className: styles.centered,
      headerClassName: styles.centered,
      defaultSort: SortDirection.DESC,
      value: (item) => item.holofoil,
      cell: (value) => value && <AppIcon icon={faCheck} />,
      filter: (value) => `${value ? '' : '-'}is:holofoil`,
      csv: 'Holofoil',
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
        header: <AppIcon icon={thumbsUpIcon} />,
        dropdownLabel: t('Organizer.Columns.WishList'),
        className: styles.centered,
        headerClassName: styles.centered,
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
      csv: 'Rarity',
      value: (i) => i.rarity,
      filter: (value) => `is:${value}`,
    }),
    c({
      id: 'itemTier',
      header: t('Organizer.Columns.ItemTier'),
      className: styles.centered,
      headerClassName: styles.centered,
      defaultSort: SortDirection.DESC,
      value: (item) => item.tier,
      filter: (value) => `tier:${value}`,
      csv: 'Tier',
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
        className: styles.modslot,
        // TODO: only show if there are mod slots
        value: (item) =>
          isArtifice(item) ? 'artifice' : getSpecialtySocketMetadata(item)?.slotTag,
        cell: (value, item) =>
          value && <SpecialtyModSlotIcon className={styles.modslotIcon} item={item} />,
        filter: (value) => (value !== undefined ? `modslot:${value}` : ''),
        csv: (value) => ['Seasonal Mod', value ?? ''],
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
      !isGhost &&
      c({
        id: 'archetype',
        header: isWeapon ? t('Organizer.Columns.Frame') : t('Organizer.Columns.Archetype'),
        className: styles.noWrap,
        csv: 'Archetype',
        value: (item) =>
          item.bucket.inWeapons
            ? getWeaponArchetype(item)?.displayProperties.name
            : getArmorArchetype(item)?.displayProperties.name,
        cell: (_val, item) => {
          const plugged = item.bucket.inWeapons
            ? getWeaponArchetypeSocket(item)?.plugged
            : getArmorArchetypeSocket(item)?.plugged;
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
      isArmor &&
      c({
        id: 'tertiary',
        className: styles.centered,
        header: t('Organizer.Columns.TertiaryStat'),
        csv: 'Tertiary Stat',
        value: (item) =>
          isArmor3(item) ? realD2ArmorStatSearchByHash[getArmor3StatFocus(item)[2]] : undefined,
        cell: (statName, item) => {
          if (statName) {
            const stat = item.stats?.find((s) => s.statHash === statHashByName[statName]);
            if (stat) {
              return (
                <BungieImage
                  title={stat.displayProperties.name}
                  src={stat.displayProperties.icon}
                  width={20}
                  height={20}
                />
              );
            }
          }
        },
        filter: (statName) => `tertiarystat:${statName}`,
      }),
    destinyVersion === 2 &&
      isArmor &&
      c({
        id: 'tuning',
        className: styles.centered,
        header: t('Organizer.Columns.TuningStat'),
        csv: 'Tuning Stat',
        value: (item) =>
          isArmor3(item) ? realD2ArmorStatSearchByHash[getArmor3TuningStat(item)!] : undefined,
        cell: (statName, item) => {
          if (statName) {
            const stat = item.stats?.find((s) => s.statHash === statHashByName[statName]);
            if (stat) {
              return (
                <BungieImage
                  title={stat.displayProperties.name}
                  src={stat.displayProperties.icon}
                  width={20}
                  height={20}
                />
              );
            }
          }
        },
        filter: (statName) => `tunedstat:${statName}`,
      }),
    destinyVersion === 2 &&
      isArmor &&
      !isSpreadsheet &&
      c({
        id: 'intrinsics',
        className: styles.perkLike,
        header: t('Organizer.Columns.Perks'),
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
    destinyVersion === 2 &&
      isWeapon &&
      !isSpreadsheet &&
      c({
        id: 'traits',
        className: styles.perkLike,
        header: t('Organizer.Columns.Traits'),
        value: (item) => perkString(getSocketsByType(item, 'traits')),
        cell: (_val, item) => (
          <PerksCell
            item={item}
            sockets={getSocketsByType(item, 'traits')}
            onPlugClicked={onPlugClicked}
          />
        ),
        sort: perkStringSort,
        filter: perkStringFilter,
      }),
    (isWeapon || isSpreadsheet) &&
      c({
        id: 'perks',
        className: styles.perks,
        header:
          destinyVersion === 2
            ? isWeapon
              ? t('Organizer.Columns.OtherPerks')
              : t('Organizer.Columns.Mods')
            : t('Organizer.Columns.Perks'),
        value: (item) =>
          perkString(
            getSocketsByType(item, isSpreadsheet || destinyVersion === 1 ? 'perks' : 'components'),
          ),
        cell: (_val, item) =>
          isD1Item(item) ? (
            <D1PerksCell item={item} />
          ) : (
            <PerksCell
              item={item}
              sockets={getSocketsByType(
                item,
                isSpreadsheet || destinyVersion === 1 ? 'perks' : 'components',
              )}
              onPlugClicked={onPlugClicked}
            />
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
        id: 'originTrait',
        className: styles.perkLike,
        header: t('Organizer.Columns.OriginTraits'),
        value: (item) => perkString(getSocketsByType(item, 'origin')),
        cell: (_val, item) => (
          <PerksCell
            item={item}
            sockets={getSocketsByType(item, 'origin')}
            onPlugClicked={onPlugClicked}
          />
        ),
        sort: perkStringSort,
        filter: perkStringFilter,
      }),
    destinyVersion === 2 &&
      !isSpreadsheet &&
      c({
        id: 'mods',
        className: styles.perkLike,
        header: t('Organizer.Columns.Mods'),
        value: (item) => perkString(getSocketsByType(item, 'mods')),
        cell: (_val, item) => (
          <PerksCell
            item={item}
            sockets={getSocketsByType(item, 'mods')}
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
        className: styles.perkLike,
        header: t('Organizer.Columns.Shaders'),
        value: (item) => perkString(getSocketsByType(item, 'cosmetics')),
        cell: (_val, item) => (
          <PerksCell
            item={item}
            sockets={getSocketsByType(item, 'cosmetics')}
            onPlugClicked={onPlugClicked}
          />
        ),
        sort: perkStringSort,
        filter: perkStringFilter,
      }),
    !isSpreadsheet &&
      (isWeapon || (isArmor && destinyVersion === 1)) &&
      perksGridColumn(
        styles.perksGrid,
        styles.perks,
        onPlugClicked,
        undefined,
        tl('Organizer.Columns.PerksGrid'),
      ),
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
        cell: (value) => <span style={getD1QualityColor(value, 'color')}>{value}%</span>,
        filter: (value) => `quality:>=${value}`,
      }),
    ...(destinyVersion === 2 && isArmor ? customStats : []),
    destinyVersion === 2 &&
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
        header: <HarmonizerIcon />,
        dropdownLabel: t('Organizer.Columns.Harmonizable'),
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
              <KillTrackerInfo tracker={killTrackerInfo} className={styles.locationCell} />
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
        value: (item) => {
          const s = source(item);
          return s === 'legendaryengram' ? 'engram' : s;
        },
        filter: (value) => `source:${value === 'engram' ? 'legendaryengram' : value}`,
      }),
    c({
      id: 'year',
      csv: 'Year',
      className: styles.centered,
      headerClassName: styles.centered,
      header: t('Organizer.Columns.Year'),
      value: (item) => getItemYear(item),
      filter: (value) => `year:${value}`,
    }),
    destinyVersion === 2 &&
      c({
        id: 'season',
        csv: 'Season',
        className: styles.centered,
        headerClassName: styles.centered,
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
      className: styles.loadouts,
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

export function getStatColumns(
  stats: DimStat[],
  customStatDefs: CustomStatDef[],
  destinyVersion: DestinyVersion,
  {
    isArmor,
    isSpreadsheet = false,
    showStatLabel = false,
    extraStatInfo = false,
    className,
    headerClassName,
  }: {
    isArmor: boolean;
    isSpreadsheet?: boolean;
    showStatLabel?: boolean;
    /** Whether to show extra stat info icons (e.g. that the total includes tuners, or that the stat is tuned) and stat bars. */
    extraStatInfo?: boolean;
    className?: string;
    headerClassName?: string;
  },
) {
  const customStatHashes = customStatDefs.map((c) => c.statHash);
  const statsGroup: ColumnGroup = {
    id: 'stats',
    header: t('Organizer.Columns.Stats'),
  };
  const baseStatsGroup: ColumnGroup = {
    id: 'baseStats',
    header: t('Organizer.Columns.BaseStats'),
  };
  const baseMasterworkStatsGroup: ColumnGroup = {
    id: 'baseMasterworkStats',
    header: t('Compare.AssumeMasterworked'),
  };
  const statQualityGroup: ColumnGroup = {
    id: 'statQuality',
    header: t('Organizer.Columns.StatQuality'),
  };

  const csvStatNames = csvStatNamesForDestinyVersion(destinyVersion);

  const statColumns: ColumnWithStat[] = filterMap(stats, (stat): ColumnWithStat | undefined => {
    const statHash = stat.statHash as StatHashes;
    if (customStatHashes.includes(statHash)) {
      // Exclude custom total, it has its own column
      return undefined;
    }
    const statLabel = statLabels[statHash];

    return {
      id: `stat${statHash}`,
      header: stat.displayProperties.hasIcon ? (
        <span title={stat.displayProperties.name}>
          <BungieImage src={stat.displayProperties.icon} />
          {showStatLabel && stat.displayProperties.name}
        </span>
      ) : statLabel ? (
        t(statLabel)
      ) : (
        stat.displayProperties.name
      ),
      className,
      headerClassName,
      statHash,
      columnGroup: statsGroup,
      value: (item) => {
        const stat = item.stats?.find((s) => s.statHash === statHash);
        if (stat?.statHash === StatHashes.RecoilDirection) {
          return recoilValue(stat.value);
        }
        return stat?.value;
      },
      cell: (_val, item, ctx) => {
        const stat = item.stats?.find((s) => s.statHash === statHash);
        if (!stat) {
          return null;
        }
        return (
          <CompareStat
            min={ctx?.min ?? 0}
            max={ctx?.max ?? 0}
            stat={stat}
            item={item}
            value={stat.value}
            extraStatInfo={extraStatInfo}
          />
        );
      },
      defaultSort: stat.smallerIsBetter ? SortDirection.ASC : SortDirection.DESC,
      filter: (value) => {
        const statName = invert(statHashByName)[statHash];
        return `stat:${statName}:${statName === 'rof' ? '=' : '>='}${value}`;
      },
      csv: (_value, item) => {
        // Re-find the stat instead of using the value passed in, because the
        // value passed in can be different if it's Recoil.
        const stat = item.stats?.find((s) => s.statHash === statHash);
        return [csvStatNames.get(statHash) ?? `UnknownStat ${statHash}`, stat?.value ?? 0];
      },
      sort: (firstValue, secondValue, firstItem, secondItem) => {
        if (typeof firstValue === 'number' && typeof secondValue === 'number') {
          const firstItemTuningHash = getArmor3TuningStat(firstItem);
          const secondItemTuningHash = getArmor3TuningStat(secondItem);
          if ((statHash as number) === TOTAL_STAT_HASH) {
            if (firstItemTuningHash) {
              firstValue += 0.5;
            } else if (isArtifice(firstItem)) {
              firstValue += 0.3;
            }
            if (secondItemTuningHash) {
              secondValue += 0.5;
            } else if (isArtifice(secondItem)) {
              secondValue += 0.3;
            }
          } else {
            if (firstItemTuningHash === statHash) {
              firstValue += 0.5;
            }
            if (secondItemTuningHash === statHash) {
              secondValue += 0.5;
            }
          }
        }
        return primitiveComparator(firstValue, secondValue);
      },
    };
  }).sort(compareBy((s) => getStatSortOrder(s.statHash)));

  const baseStatColumns: ColumnWithStat[] =
    destinyVersion === 2 && (isArmor || !isSpreadsheet)
      ? statColumns.map((column) => ({
          ...column,
          id: `base${column.statHash}`,
          columnGroup: baseStatsGroup,
          value: (item): number | undefined => {
            const stat = item.stats?.find((s) => s.statHash === column.statHash);
            if (stat?.statHash === StatHashes.RecoilDirection) {
              return recoilValue(stat.base);
            }
            return stat?.base;
          },
          cell: (_val, item, ctx) => {
            const stat = item.stats?.find((s) => s.statHash === column.statHash);
            if (!stat) {
              return null;
            }
            // TODO: force a width if this is armor, so we see the bar?
            return (
              <CompareStat
                min={ctx?.min ?? 0}
                max={ctx?.max ?? 0}
                stat={stat}
                item={item}
                value={stat.base}
                extraStatInfo={extraStatInfo}
              />
            );
          },
          filter: (value) => `basestat:${invert(statHashByName)[column.statHash]}:>=${value}`,
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

  const baseMasterworkStatColumns: ColumnWithStat[] =
    destinyVersion === 2 && isArmor && !isSpreadsheet
      ? statColumns.map((column) => ({
          ...column,
          id: `baseMasterwork${column.statHash}`,
          columnGroup: baseMasterworkStatsGroup,
          value: (item): number | undefined => {
            const stat = item.stats?.find((s) => s.statHash === column.statHash);
            return stat?.baseMasterworked;
          },
          cell: (val, item, ctx) => {
            const stat = item.stats?.find((s) => s.statHash === column.statHash);
            if (typeof val !== 'number') {
              return null;
            }
            // TODO: force a width if this is armor, so we see the bar?
            return (
              <CompareStat
                min={ctx?.min ?? 0}
                max={ctx?.max ?? 0}
                stat={stat}
                item={item}
                value={val}
                extraStatInfo={extraStatInfo}
              />
            );
          },
          filter: (value) => `basestat:${invert(statHashByName)[column.statHash]}:>=${value}`,
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
      ? stats
          .map((stat): ColumnWithStat => {
            const statHash = stat.statHash as StatHashes;
            return {
              statHash,
              id: `quality_${statHash}`,
              columnGroup: statQualityGroup,
              header: t('Organizer.Columns.StatQualityStat', {
                stat: stat.displayProperties.name,
              }),
              className,
              headerClassName: className,
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
                  <span style={getD1QualityColor(stat?.qualityPercentage?.min || 0, 'color')}>
                    {value}%
                  </span>
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

  return {
    statColumns,
    baseStatColumns,
    baseMasterworkStatColumns,
    d1ArmorQualityByStat,
  };
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
              onClick={(e: React.MouseEvent) => !e.shiftKey && editLoadout(loadout, owner)}
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
                <div
                  className={clsx(styles.miniPerkContainer, {
                    [styles.enhancedArrow]: isEnhancedPerk(p.plugDef),
                  })}
                >
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
                    {p.xpRequired > 0 && (!p.unlocked || p.xp < p.xpRequired) && (
                      <> ({percent(p.xp / p.xpRequired)})</>
                    )}
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

export function perkString(sockets: DimSocket[]): string | undefined {
  if (!sockets.length) {
    return undefined;
  }

  // TODO: filter out empty sockets, maybe sort?
  return sockets
    .flatMap((socket) => socket.plugOptions.map((p) => p.plugDef.displayProperties.name))
    .filter(Boolean)
    .join(',');
}

export function getIntrinsicSockets(item: DimItem): DimSocket[] {
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
export function buildStatInfo(items: DimItem[]): DimStat[] {
  if (!items.length) {
    return emptyArray<DimStat>();
  }

  const statHashes: { [statHash: number]: DimStat } = {};
  for (const item of items) {
    if (item.stats) {
      for (const stat of item.stats) {
        // Just use the first item's stats as the source of truth.
        statHashes[stat.statHash] ??= stat;
      }
    }
  }
  return Object.values(statHashes);
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
