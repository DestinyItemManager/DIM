import { CustomStatDef, DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { EnergyCostIcon } from 'app/dim-ui/ElementIcon';
import { t } from 'app/i18next-t';
import { DimStat } from 'app/inventory/item-types';
import { PlugClickedHandler } from 'app/inventory/store/override-sockets';
import ArchetypeSocket from 'app/item-popup/ArchetypeSocket';
import {
  d1QualityColumn,
  getIntrinsicSockets,
  getStatColumns,
  modsColumn,
  perksGridColumn,
  perkString,
  perkStringSort,
} from 'app/organizer/Columns';
import { createCustomStatColumns } from 'app/organizer/CustomStatColumns';
import { ColumnDefinition, SortDirection, Value } from 'app/organizer/table-types';
import { quoteFilterString } from 'app/search/query-parser';
import { Settings } from 'app/settings/initial-settings';
import { compact } from 'app/utils/collections';
import {
  getArmorArchetype,
  getArmorArchetypeSocket,
  getWeaponArchetype,
  getWeaponArchetypeSocket,
} from 'app/utils/socket-utils';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import * as styles from './CompareColumns.m.scss';
import CompareStat from './CompareStat';

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
  armorCompare: Settings['armorCompare'],
  primaryStatDescription: DestinyDisplayPropertiesDefinition | undefined,
  initialItemId: string | undefined,
  onPlugClicked: PlugClickedHandler,
): ColumnDefinition[] {
  const isArmor = itemsType === 'armor';
  const isWeapon = itemsType === 'weapon';
  const isGeneral = itemsType === 'general';

  const { statColumns, baseStatColumns, baseMasterworkStatColumns, d1ArmorQualityByStat } =
    getStatColumns(stats, customStatDefs, destinyVersion, {
      isArmor,
      showStatLabel: true,
      extraStatInfo: true,
      className: styles.stat,
    });

  const preferredStatColumns =
    !isArmor || armorCompare === 'current'
      ? statColumns
      : armorCompare === 'base'
        ? baseStatColumns
        : baseMasterworkStatColumns;

  const customStatColumns = createCustomStatColumns(customStatDefs, {
    className: styles.stat,
    hideFormula: true,
    withMasterwork: armorCompare === 'baseMasterwork',
    extraStatInfo: true,
  });

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
    ...preferredStatColumns,
    ...d1ArmorQualityByStat,
    destinyVersion === 1 && isArmor && d1QualityColumn,
    ...(destinyVersion === 2 && isArmor ? customStatColumns : []),
    destinyVersion === 2 &&
      c({
        id: 'archetype',
        header: t('Organizer.Columns.Archetype'),
        className: styles.archetype,
        headerClassName: styles.archetype,
        value: (item) =>
          item.bucket.inWeapons
            ? getWeaponArchetype(item)?.displayProperties.name
            : getArmorArchetype(item)?.displayProperties.name,
        cell: (_val, item) => {
          const s = item.bucket.inWeapons
            ? getWeaponArchetypeSocket(item)
            : getArmorArchetypeSocket(item);
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
      perksGridColumn(
        styles.perks,
        clsx(styles.perks, { [styles.weaponPerksHeader]: isWeapon }),
        onPlugClicked,
        initialItemId,
      ),
    destinyVersion === 2 &&
      modsColumn(
        clsx(styles.perks, { [styles.imageRoom]: isGeneral }),
        styles.perks,
        isWeapon,
        onPlugClicked,
      ),
    // Armor intrinsic perks
    destinyVersion === 2 &&
      isArmor &&
      c({
        id: 'intrinsics',
        className: styles.perks,
        header: t('Organizer.Columns.Perks'),
        value: (item) => {
          const intrinsics = getIntrinsicSockets(item);
          return (
            // Sort by PCI first so that similar intrinsics land near each other before sub-alphabetizing
            `${intrinsics[0]?.plugged?.plugDef.plug.plugCategoryIdentifier ?? ''},${perkString(
              intrinsics,
            )}`
          );
        },
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
