import {
  AppIcon,
  faCheck,
  lockIcon,
  powerIndicatorIcon,
  thumbsDownIcon,
  thumbsUpIcon,
} from 'app/shell/icons';
import { ColumnDefinition, ColumnGroup, SortDirection } from './table-types';
import { DestinyClass, DestinyCollectibleState } from 'bungie-api-ts/destiny2';
import { ItemInfos, getNotes, getTag, tagConfig } from 'app/inventory/dim-item-info';
import {
  getItemDamageShortName,
  getItemSpecialtyModSlotDisplayName,
  getSpecialtySocketMetadata,
  getItemPowerCapFinalSeason,
} from 'app/utils/item-utils';

import BungieImage from 'app/dim-ui/BungieImage';
import { D2EventInfo } from 'data/d2/d2-event-info';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { D2SeasonInfo } from 'data/d2/d2-season-info';
import { DimItem, D1Item } from 'app/inventory/item-types';
import { DtrRating } from 'app/item-review/dtr-api-types';
import ElementIcon from 'app/inventory/ElementIcon';
import { INTRINSIC_PLUG_CATEGORY } from 'app/inventory/store/sockets';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { ItemStatValue } from 'app/item-popup/ItemStat';
import { Loadout } from 'app/loadout/loadout-types';
import NewItemIndicator from 'app/inventory/NewItemIndicator';
import PlugTooltip from 'app/item-popup/PlugTooltip';
import PressTip from 'app/dim-ui/PressTip';
import RatingIcon from 'app/inventory/RatingIcon';
/* eslint-disable react/jsx-key, react/prop-types */
import React from 'react';
import SpecialtyModSlotIcon from 'app/dim-ui/SpecialtyModSlotIcon';
import { StatInfo } from 'app/compare/Compare';
import { StatTotalToggle } from 'app/dim-ui/CustomStatTotal';
import TagIcon from 'app/inventory/TagIcon';
import { TagValue, DestinyVersion } from '@destinyitemmanager/dim-api-types';
import _ from 'lodash';
import clsx from 'clsx';
import { compareBy } from 'app/utils/comparators';
import { getRating } from 'app/item-review/reducer';
import { ghostBadgeContent } from 'app/inventory/BadgeInfo';
import { source } from 'app/inventory/spreadsheets';
import { statHashByName } from 'app/search/search-filter-values';
import { statAllowList } from 'app/inventory/store/stats';
import styles from './ItemTable.m.scss';
import { t } from 'app/i18next-t';
import { percent, getColor } from 'app/shell/filters';
import { PowerCapDisclaimer } from 'app/dim-ui/PowerCapDisclaimer';

/**
 * Get the ID used to select whether this column is shown or not.
 */
export function getColumnSelectionId(column: ColumnDefinition) {
  return column.columnGroup ? column.columnGroup.id : column.id;
}

const booleanCell = (value) => (value ? <AppIcon icon={faCheck} /> : undefined);

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
  ratings: { [key: string]: DtrRating },
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
    4284893193: t('Organizer.Stats.RPM'),
    4188031367: t('Organizer.Stats.Reload'), // Reload Speed
    1345609583: t('Organizer.Stats.Aim'), // Aim Assistance
    2715839340: t('Organizer.Stats.Recoil'), // Recoil Direction
    1931675084: t('Organizer.Stats.Inventory'), // Inventory Size
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
            <BungieImage
              src={statInfo.displayProperties.icon}
              title={statInfo.displayProperties.name}
            />
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
      }
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
          cell: (value) => value,
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
      cell: (value: string, item) => (
        <ItemPopupTrigger item={item}>
          {(ref, onClick) => (
            <div ref={ref} onClick={onClick} className={styles.itemIcon}>
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
        value: (item) => item.isDestiny2() && item.powerCap,
        cell: (value, item) =>
          value && (
            <>
              {t('Stats.PowerCapWithSeason', {
                powerCap: value,
                finalSeason: getItemPowerCapFinalSeason(item),
              })}
              <PowerCapDisclaimer item={item} />
            </>
          ),
        defaultSort: SortDirection.DESC,
        filter: (value) => `sunsetsafter:>=${value}`,
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
        value: (item) => item.isDestiny2() && item.energy?.energyCapacity,
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
          const roll = wishList?.[item.id];
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
    destinyVersion === 2 && {
      id: 'reacquirable',
      header: t('Organizer.Columns.Reacquirable'),
      value: (item) =>
        item.isDestiny2() &&
        item.collectibleState !== null &&
        !(item.collectibleState & DestinyCollectibleState.NotAcquired) &&
        !(item.collectibleState & DestinyCollectibleState.PurchaseDisabled),
      defaultSort: SortDirection.DESC,
      cell: booleanCell,
      filter: (value) => (value ? 'is:reacquirable' : 'not:reaquireable'),
    },
    $featureFlags.reviewsEnabled && {
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
      filter: (value) => `rating:>=${value}`,
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
      value: (item) =>
        item.isDestiny1()
          ? item.year
          : item.isDestiny2()
          ? D2SeasonInfo[item.season].year
          : undefined,
      filter: (value) => `year:${value}`,
    },
    destinyVersion === 2 && {
      id: 'season',
      header: t('Organizer.Columns.Season'),
      value: (i) => i.isDestiny2() && i.season,
      filter: (value) => `season:${value}`,
    },
    destinyVersion === 2 && {
      id: 'event',
      header: t('Organizer.Columns.Event'),
      value: (item) => (item.isDestiny2() && item.event ? D2EventInfo[item.event].name : undefined),
      filter: (value) => `event:${value}`,
    },
    destinyVersion === 2 &&
      isGhost && {
        id: 'ghost',
        header: t('Organizer.Columns.Ghost'),
        value: (item) => ghostBadgeContent(item).join(''),
      },
    destinyVersion === 2 &&
      isArmor && {
        id: 'modslot',
        header: t('Organizer.Columns.ModSlot'),
        // TODO: only show if there are mod slots
        value: getItemSpecialtyModSlotDisplayName,
        cell: (value, item) =>
          value && <SpecialtyModSlotIcon className={styles.modslotIcon} item={item} />,
        filter: (_, item) => {
          const modSocketTypeHash = getSpecialtySocketMetadata(item)!;
          return `modslot:${modSocketTypeHash?.tag || 'none'}`;
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
                  ?.plug,
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
        filter: (value) => `perkname:"${value}"`,
      },
    (destinyVersion === 2 || isWeapon) && {
      id: 'breaker',
      header: t('Organizer.Columns.Breaker'),
      value: (item) => item.isDestiny2() && item.breakerType?.displayProperties.name,
      cell: (value, item) =>
        item.isDestiny2() &&
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
        item.isDestiny1() ? <D1PerksCell item={item} /> : <PerksCell defs={defs} item={item} />,
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
        value: (item) => (item.isDestiny1() && item.quality ? item.quality.min : 0),
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
      },
    destinyVersion === 2 &&
      isWeapon && {
        id: 'masterworkTier',
        header: t('Organizer.Columns.MasterworkTier'),
        value: (item) => (item.isDestiny2() ? item.masterworkInfo?.tier : undefined),
        defaultSort: SortDirection.DESC,
        filter: (value) => `masterwork:>=${value}`,
      },
    destinyVersion === 2 &&
      isWeapon && {
        id: 'masterworkStat',
        header: t('Organizer.Columns.MasterworkStat'),
        value: (item) =>
          item.isDestiny2()
            ? `${item.masterworkInfo?.stats?.[0]?.name ?? ''}${
                item.masterworkInfo?.stats?.[1]?.name ? ', ' : ''
              }${item.masterworkInfo?.stats?.[1]?.name ?? ''}`
            : undefined,
      },
    destinyVersion === 2 &&
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
        defaultSort: SortDirection.DESC,
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
  if (!item.isDestiny2() || !item.sockets) {
    return null;
  }
  const sockets = item.sockets.categories.flatMap((c) =>
    c.sockets.filter(
      (s) =>
        s.plug &&
        s.plugOptions.length > 0 &&
        ((!traitsOnly && s.plug.plugItem.collectibleHash) ||
          (s.isPerk &&
            (item.isExotic ||
              (!s.plug.plugItem.itemCategoryHashes?.includes(INTRINSIC_PLUG_CATEGORY) &&
                (!traitsOnly || s.plug.plugItem.plug.plugCategoryIdentifier === 'frames')))))
    )
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
          {socket.plugOptions.map(
            (p) =>
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
      ))}
    </>
  );
}

function D1PerksCell({ item }: { item: D1Item }) {
  if (!item.isDestiny1() || !item.talentGrid) {
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
              item.isDestiny1() && (
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
