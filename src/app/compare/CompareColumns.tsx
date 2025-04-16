import { CustomStatDef, DestinyVersion } from '@destinyitemmanager/dim-api-types';
import BungieImage from 'app/dim-ui/BungieImage';
import { EnergyCostIcon } from 'app/dim-ui/ElementIcon';
import { t } from 'app/i18next-t';
import { D1Item, DimItem, DimSocket, DimStat } from 'app/inventory/item-types';
import { csvStatNamesForDestinyVersion } from 'app/inventory/spreadsheets';
import { getStatSortOrder } from 'app/inventory/store/stats';
import ArchetypeSocket, { ArchetypeRow } from 'app/item-popup/ArchetypeSocket';
import ItemSockets from 'app/item-popup/ItemSockets';
import { ItemModSockets } from 'app/item-popup/ItemSocketsWeapons';
import ItemTalentGrid from 'app/item-popup/ItemTalentGrid';
import { recoilValue } from 'app/item-popup/RecoilStat';
import { getIntrinsicSockets, perkString, perkStringSort, statLabels } from 'app/organizer/Columns';
import { createCustomStatColumns } from 'app/organizer/CustomStatColumns';
import { ColumnDefinition, ColumnGroup, SortDirection, Value } from 'app/organizer/table-types';
import { quoteFilterString } from 'app/search/query-parser';
import { statHashByName } from 'app/search/search-filter-values';
import { getCompareColor } from 'app/shell/formatters';
import { compact, filterMap, invert } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import { isD1Item } from 'app/utils/item-utils';
import {
  getSocketsByType,
  getWeaponArchetype,
  getWeaponArchetypeSocket,
} from 'app/utils/socket-utils';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { StatHashes } from 'data/d2/generated-enums';
import styles from './CompareColumns.m.scss';
import CompareStat from './CompareStat';

/**
 * This function generates the columns.
 */
// TODO: converge this with Columns.tsx
export function getColumns(
  itemsType: 'weapon' | 'armor' | 'general',
  hasEnergy: boolean,
  stats: DimStat[],
  customStatDefs: CustomStatDef[],
  destinyVersion: DestinyVersion,
  compareBaseStats: boolean,
  primaryStatDescription: DestinyDisplayPropertiesDefinition | undefined,
  initialItemId: string | undefined,
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

  const csvStatNames = csvStatNamesForDestinyVersion(destinyVersion);

  type ColumnWithStat = ColumnDefinition & { statHash: StatHashes };
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
        <span>
          <BungieImage src={stat.displayProperties.icon} aria-hidden={true} />
          {stat.displayProperties.name}
        </span>
      ) : statLabel ? (
        t(statLabel)
      ) : (
        stat.displayProperties.name
      ),
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
    };
  }).sort(compareBy((s) => getStatSortOrder(s.statHash)));

  const isArmor = itemsType === 'armor';
  const isWeapon = itemsType === 'weapon';
  const isGeneral = itemsType === 'general';

  const baseStatColumns: ColumnWithStat[] =
    destinyVersion === 2 && isArmor
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
            return (
              <CompareStat
                min={ctx?.min ?? 0}
                max={ctx?.max ?? 0}
                stat={stat}
                item={item}
                value={stat.base}
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
                  <span style={{ color: getCompareColor(stat?.qualityPercentage?.min || 0) }}>
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

  const customStats = createCustomStatColumns(customStatDefs, undefined, true);
  // TODO: Until Organizer also uses compareStat
  const cell: ColumnDefinition<number>['cell'] = (value: number, item, ctx) => (
    <CompareStat min={ctx?.min ?? 0} max={ctx?.max ?? 0} item={item} value={value} />
  );
  for (const c of customStats) {
    c.cell = cell;
  }

  // TODO: maybe add destinyVersion / usecase to the ColumnDefinition type??
  const columns: ColumnDefinition[] = compact([
    c({
      id: 'name',
      header: t('Organizer.Columns.Name'),
      csv: 'Name',
      className: styles.name,
      value: (i) => i.name,
      cell: (val, i) => (
        <span
          className={clsx({
            [styles.initialItem]: initialItemId === i.id,
          })}
          title={initialItemId === i.id ? t('Compare.InitialItem') : undefined}
        >
          {val}
        </span>
      ),
      filter: (name) => `name:${quoteFilterString(name)}`,
    }),
    (isArmor || isWeapon) &&
      c({
        id: 'power',
        csv: destinyVersion === 2 ? 'Power' : 'Light',
        header: t('Organizer.Columns.Power'),
        // We don't want to show a value for power if it's 0
        value: (item) => (item.power === 0 ? undefined : item.power),
        cell: (val, item, ctx) =>
          val !== undefined ? (
            <CompareStat min={ctx?.min ?? 0} max={ctx?.max ?? 0} item={item} value={val} />
          ) : (
            t('Stats.NotApplicable')
          ),
        defaultSort: SortDirection.DESC,
        filter: (value) => `power:>=${value}`,
      }),
    primaryStatDescription &&
      c({
        id: 'primaryStat',
        header: primaryStatDescription.name,
        // We don't want to show a value for power if it's 0
        value: (item) => item.primaryStat?.value,
        cell: (val, item, ctx) =>
          val !== undefined ? (
            <CompareStat min={ctx?.min ?? 0} max={ctx?.max ?? 0} item={item} value={val} />
          ) : (
            t('Stats.NotApplicable')
          ),
        defaultSort: SortDirection.DESC,
      }),
    hasEnergy &&
      c({
        id: 'energy',
        header: t('Organizer.Columns.Energy'),
        csv: 'Energy Capacity',
        className: styles.energy,
        value: (item) => item.energy?.energyCapacity,
        cell: (val, item, ctx) =>
          val !== undefined && (
            <>
              <EnergyCostIcon />
              <CompareStat min={ctx?.min ?? 0} max={ctx?.max ?? 0} item={item} value={val} />
            </>
          ),
        defaultSort: SortDirection.DESC,
        filter: (value) => `energycapacity:>=${value}`,
      }),
    ...(compareBaseStats && isArmor ? baseStatColumns : statColumns),
    ...d1ArmorQualityByStat,
    destinyVersion === 1 &&
      isArmor &&
      c({
        id: 'quality',
        header: t('Organizer.Columns.Quality'),
        csv: '% Quality',
        value: (item) => (isD1Item(item) && item.quality ? item.quality.min : 0),
        cell: (value) => <span style={{ color: getCompareColor(value) }}>{value}%</span>,
        filter: (value) => `quality:>=${value}`,
      }),
    ...(destinyVersion === 2 && isArmor ? customStats : []),
    destinyVersion === 2 &&
      isWeapon &&
      c({
        id: 'archetype',
        header: t('Organizer.Columns.Archetype'),
        className: styles.archetype,
        headerClassName: styles.archetype,
        value: (item) => getWeaponArchetype(item)?.displayProperties.name,
        cell: (_val, item) => {
          const s = getWeaponArchetypeSocket(item);
          return (
            s && (
              <ArchetypeRow minimal key={s.socketIndex}>
                <ArchetypeSocket archetypeSocket={s} item={item} />
              </ArchetypeRow>
            )
          );
        },
        filter: (value) => (value ? `exactperk:${quoteFilterString(value)}` : undefined),
      }),
    (isWeapon || ((isArmor || isGeneral) && destinyVersion === 1)) &&
      c({
        id: 'perks',
        className: clsx(styles.perks, { [styles.weaponPerks]: isWeapon }),
        headerClassName: clsx(styles.perks, { [styles.weaponPerksHeader]: isWeapon }),
        header: t('Organizer.Columns.Perks'),
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
      }),
    destinyVersion === 2 &&
      c({
        id: 'mods',
        className: clsx(styles.perks, { [styles.imageRoom]: isGeneral }),
        headerClassName: styles.perks,
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
      }),
    // Armor intrinsic perks
    destinyVersion === 2 &&
      isArmor &&
      c({
        id: 'intrinsics',
        className: styles.perks,
        header: t('Organizer.Columns.Intrinsics'),
        value: (item) => perkString(getIntrinsicSockets(item)),
        cell: (_val, item) => {
          const sockets = getIntrinsicSockets(item);
          return (
            <>
              {sockets.map((s) => (
                <ArchetypeRow minimal key={s.socketIndex}>
                  <ArchetypeSocket archetypeSocket={s} item={item} />
                </ArchetypeRow>
              ))}
            </>
          );
        },
        sort: perkStringSort,
      }),
  ]);

  return columns;
}
