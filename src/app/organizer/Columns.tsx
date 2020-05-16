/* eslint-disable react/jsx-key, react/prop-types */
import React from 'react';
import { DimItem, DimPlug, DimSocket } from 'app/inventory/item-types';
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
import { t } from 'app/i18next-t';
import { emptyArray } from 'app/utils/empty';
import { ghostBadgeContent } from 'app/inventory/BadgeInfo';
import { ItemStatValue } from 'app/item-popup/ItemStat';

/**
 * Get the ID used to select whether this column is shown or not.
 */
export function getColumnSelectionId(column: ColumnDefinition) {
  return column.columnGroup ? column.columnGroup.id : column.id;
}

// TODO: just default booleans to this
const booleanCell = (value) => (value ? <AppIcon icon={faCheck} /> : undefined);

const modSocketCategories = [
  2685412949,
  590099826, // Armor mods
  3301318876 // Ghost perks
];

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
  loadouts: Loadout[],
  newItems: Set<string>
): ColumnDefinition[] {
  const hasWishList = !_.isEmpty(wishList);

  // TODO: most of these are constant and can be hoisted?

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
    header: t('Organizer.Columns.Stats')
  };
  const baseStatsGroup: ColumnGroup = {
    id: 'baseStats',
    header: t('Organizer.Columns.BaseStats')
  };

  // Some stat labels are long. This lets us replace them with i18n
  const statLabels = {
    4284893193: t('Organizer.Stats.RPM'),
    4188031367: t('Organizer.Stats.Reload'), // Reload Speed
    1345609583: t('Organizer.Stats.Aim'), // Aim Assistance
    2715839340: t('Organizer.Stats.Recoil'), // Recoil Direction
    1931675084: t('Organizer.Stats.Inventory') // Inventory Size
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
          }
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
    cell: (value) => value,
    filter: (value) => `basestat:${_.invert(statHashByName)[column.statHash]}:>=${value}`
  }));

  const firstItem = items[0];
  const isGhost =
    firstItem &&
    Boolean(
      firstItem.isDestiny2 && firstItem.isDestiny2() && firstItem.itemCategoryHashes?.includes(39)
    );
  const isArmor = firstItem?.bucket.inArmor;
  const isWeapon = firstItem?.bucket.inWeapons;

  const columns: ColumnDefinition[] = _.compact([
    {
      id: 'icon',
      header: t('Organizer.Columns.Icon'),
      value: (i) => i.icon,
      cell: (value: string, item) => (
        <ItemPopupTrigger item={item}>
          {(ref, onClick) => (
            <div ref={ref} onClick={onClick}>
              <BungieImage src={value} className={clsx({ [styles.masterwork]: item.masterwork })} />
              {item.masterwork && (
                <div
                  className={clsx(styles.masterworkOverlay, { [styles.exotic]: item.isExotic })}
                />
              )}
            </div>
          )}
        </ItemPopupTrigger>
      ),
      noSort: true,
      noHide: true
    },
    {
      id: 'name',
      header: t('Organizer.Columns.Name'),
      value: (i) => i.name,
      filter: (name) => `name:"${name}"`
    },
    !isGhost && {
      id: 'power',
      header: <AppIcon icon={powerIndicatorIcon} />,
      value: (item) => item.primStat?.value,
      defaultSort: SortDirection.DESC,
      filter: (value) => `power:>=${value}`
    },
    !isGhost && {
      id: 'dmg',
      header: isArmor ? t('Organizer.Columns.Element') : t('Organizer.Columns.Damage'),
      value: (item) => item.element?.displayProperties.name,
      cell: (_, item) => <ElementIcon className={styles.inlineIcon} element={item.element} />,
      filter: (_, item) => `is:${getItemDamageShortName(item)}`
    },
    isArmor && {
      id: 'energy',
      header: t('Organizer.Columns.Energy'),
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
      header: t('Organizer.Columns.Tag'),
      value: (item) => getTag(item, itemInfos),
      cell: (value: TagValue) => <TagIcon tag={value} />,
      sort: compareBy((tag: TagValue) => (tag && tagConfig[tag] ? tagConfig[tag].sortOrder : 1000)),
      filter: (value) => `tag:${value || 'none'}`
    },
    {
      id: 'new',

      header: t('Organizer.Columns.New'),
      value: (item) => newItems.has(item.id),
      cell: booleanCell,
      defaultSort: SortDirection.DESC,
      filter: (value) => (value ? 'is:new' : 'not:new')
    },
    isWeapon &&
      hasWishList && {
        id: 'wishList',
        header: t('Organizer.Columns.WishList'),
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
      header: t('Organizer.Columns.Reacquireable'),
      value: (item) =>
        item.isDestiny2() &&
        item.collectibleState !== null &&
        !(item.collectibleState & DestinyCollectibleState.NotAcquired) &&
        !(item.collectibleState & DestinyCollectibleState.PurchaseDisabled),
      defaultSort: SortDirection.DESC,
      cell: booleanCell,
      filter: (value) => (value ? 'is:reacquireable' : 'not:reaquireable')
    },
    $featureFlags.reviewsEnabled &&
      firstItem.reviewable && {
        id: 'rating',
        header: t('Organizer.Columns.Rating'),
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
      header: t('Organizer.Columns.Tier'),
      value: (i) => i.tier,
      filter: (value) => `is:${value}`
    },
    {
      id: 'source',
      header: t('Organizer.Columns.Source'),
      value: source,
      filter: (value) => `source:${value}`
    },
    {
      id: 'year',
      header: t('Organizer.Columns.Year'),
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
      header: t('Organizer.Columns.Season'),
      value: (i) => i.isDestiny2() && i.season,
      filter: (value) => `season:${value}`
    },
    {
      id: 'event',
      header: t('Organizer.Columns.Event'),
      value: (item) => (item.isDestiny2() && item.event ? D2EventInfo[item.event].name : undefined),
      filter: (value) => `event:${value}`
    },
    isGhost && {
      id: 'ghost',
      header: t('Organizer.Columns.Ghost'),
      value: (item) => ghostBadgeContent(item).join('')
    },
    isArmor && {
      id: 'modslot',
      header: t('Organizer.Columns.ModSlot'),
      // TODO: only show if there are mod slots
      value: getItemSpecialtyModSlotDisplayName,
      cell: (value, item) =>
        value && <SpecialtyModSlotIcon className={styles.modslotIcon} item={item} />,
      filter: (value) => `modslot:${value}`
    },
    isWeapon && {
      id: 'archetype',
      header: t('Organizer.Columns.Archetype'),
      value: (item) =>
        !item.isExotic && item.isDestiny2() && !item.energy
          ? item.sockets?.categories.find((c) => c.category.hash === 3956125808)?.sockets[0]?.plug
              ?.plugItem.displayProperties.name
          : undefined,
      cell: (_val, item) =>
        !item.isExotic && item.isDestiny2() && !item.energy ? (
          <div>
            {_.compact([
              item.sockets?.categories.find((c) => c.category.hash === 3956125808)?.sockets[0]?.plug
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
      header: t('Organizer.Columns.PerksMods'),
      value: () => 0, // TODO: figure out a way to sort perks
      cell: (_, item) => <PerksCell defs={defs} item={item} />,
      noSort: true,
      gridWidth: 'minmax(324px,1fr)',
      filter: (value) => `perkname:"${value}"`
    },
    ...statColumns,
    ...baseStatColumns,
    isArmor && {
      id: 'customstat',
      header: (
        <>
          {t('Organizer.Columns.CustomTotal')}
          <StatTotalToggle forClass={items[0]?.classType} readOnly={true} />
        </>
      ),
      value: (item) =>
        _.sumBy(item.stats, (s) => (customTotalStat.includes(s.statHash) ? s.base : 0)),
      defaultSort: SortDirection.DESC
    },
    isWeapon && {
      id: 'masterworkTier',
      header: t('Organizer.Columns.MasterworkTier'),
      value: (item) => (item.isDestiny2() ? item.masterworkInfo?.tier : undefined),
      defaultSort: SortDirection.DESC,
      filter: (value) => `masterwork:>=${value}`
    },
    isWeapon && {
      id: 'masterworkStat',
      header: t('Organizer.Columns.MasterworkStat'),
      value: (item) => (item.isDestiny2() ? item.masterworkInfo?.statName : undefined)
    },
    isWeapon && {
      id: 'killTracker',
      header: t('Organizer.Columns.KillTracker'),
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
      noSort: true
    },
    {
      id: 'notes',
      header: t('Organizer.Columns.Notes'),
      value: (item) => getNotes(item, itemInfos),
      gridWidth: 'minmax(200px, 1fr)',
      filter: (value) => `notes:"${value}"`
    },
    isWeapon &&
      hasWishList && {
        id: 'wishListNote',
        header: t('Organizer.Columns.WishListNotes'),
        value: (item) => wishList?.[item.id]?.notes,
        gridWidth: 'minmax(200px, 1fr)',
        filter: (value) => `wishlistnotes:"${value}"`
      }
  ]);

  return columns;
}

function PerksCell({ defs, item }: { defs: D2ManifestDefinitions; item: DimItem }) {
  const sockets =
    item.isDestiny2() && item.sockets?.categories
      ? item.sockets?.categories
          .filter((c) => true || modSocketCategories.includes(c.category.hash))
          .flatMap((c) => c.sockets)
          .filter(
            (s) =>
              (s.isPerk &&
                (item.isExotic ||
                  !s.plug?.plugItem.itemCategoryHashes?.includes(INTRINSIC_PLUG_CATEGORY))) ||
              s.plug?.plugItem.collectibleHash ||
              filterPlugs(s)
          )
      : emptyArray<DimSocket>();
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
            <div
              key={socket.socketIndex}
              className={clsx(styles.modPerks, {
                [styles.isPerk]: socket.isPerk && socket.plugOptions.length > 1
              })}
            >
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
