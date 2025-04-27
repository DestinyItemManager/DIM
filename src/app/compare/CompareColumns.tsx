import { CustomStatDef, DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { EnergyCostIcon } from 'app/dim-ui/ElementIcon';
import { t } from 'app/i18next-t';
import { DimItem, DimSocket, DimStat } from 'app/inventory/item-types';
import ArchetypeSocket from 'app/item-popup/ArchetypeSocket';
import ItemSockets from 'app/item-popup/ItemSockets';
import { ItemModSockets } from 'app/item-popup/ItemSocketsWeapons';
import ItemTalentGrid from 'app/item-popup/ItemTalentGrid';
import {
  getIntrinsicSockets,
  getStatColumns,
  perkString,
  perkStringSort,
} from 'app/organizer/Columns';
import { createCustomStatColumns } from 'app/organizer/CustomStatColumns';
import { ColumnDefinition, SortDirection, Value } from 'app/organizer/table-types';
import { quoteFilterString } from 'app/search/query-parser';
import { getCompareColor } from 'app/shell/formatters';
import { compact } from 'app/utils/collections';
import { isD1Item } from 'app/utils/item-utils';
import {
  getSocketsByType,
  getWeaponArchetype,
  getWeaponArchetypeSocket,
} from 'app/utils/socket-utils';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
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
  const isArmor = itemsType === 'armor';
  const isWeapon = itemsType === 'weapon';
  const isGeneral = itemsType === 'general';

  const { statColumns, baseStatColumns, d1ArmorQualityByStat } = getStatColumns(
    stats,
    customStatDefs,
    destinyVersion,
    {
      isArmor,
      showStatLabel: true,
    },
  );
  const customStats = createCustomStatColumns(customStatDefs, undefined, true);

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
              <div className={styles.archetypeRow}>
                <ArchetypeSocket archetypeSocket={s} item={item} />
              </div>
            )
          );
        },
        filter: (value) => (value ? `exactperk:${quoteFilterString(value)}` : undefined),
      }),
    (isWeapon || ((isArmor || isGeneral) && destinyVersion === 1)) &&
      c({
        id: 'perks',
        className: styles.perks,
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
                <div className={styles.archetypeRow} key={s.socketIndex}>
                  <ArchetypeSocket archetypeSocket={s} item={item} />
                </div>
              ))}
            </>
          );
        },
        sort: perkStringSort,
      }),
  ]);

  return columns;
}
