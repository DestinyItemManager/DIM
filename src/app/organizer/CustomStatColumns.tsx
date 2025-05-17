import { CustomStatDef } from '@destinyitemmanager/dim-api-types';
import CompareStat from 'app/compare/CompareStat';
import { CustomStatWeightsDisplay } from 'app/dim-ui/CustomStatWeights';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { ColumnDefinition, SortDirection } from './table-types';

export function createCustomStatColumns(
  customStatDefs: CustomStatDef[],
  className?: string,
  headerClassName?: string,
  hideFormula = false,
): ColumnDefinition[] {
  return customStatDefs.map(
    (c): ColumnDefinition => ({
      id: `customstat_${c.shortLabel}${c.statHash}`,
      header: hideFormula ? (
        c.label
      ) : (
        <div>
          {c.label}
          <CustomStatWeightsDisplay customStat={c} />
        </div>
      ),
      className,
      headerClassName,
      value: (item) => item.stats?.find((s) => s.statHash === c.statHash)?.value ?? 0,
      cell: (_val, item, ctx) => {
        const stat = item.stats?.find((s) => s.statHash === c.statHash);
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
          />
        );
      },
      defaultSort: SortDirection.DESC,
      filter: (value) => `stat:${c.label}:>=${value}`,
      columnGroup: {
        id: c.shortLabel + c.statHash,
        header: c.label,
      },
      limitToClass: c.class === DestinyClass.Unknown ? undefined : c.class,
    }),
  );
}
