import { CustomStatDef } from '@destinyitemmanager/dim-api-types';
import { CustomStatWeightsDisplay } from 'app/dim-ui/CustomStatWeights';
import { DimItem } from 'app/inventory/item-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { ColumnDefinition, SortDirection } from './table-types';

export function createCustomStatColumns(
  customStatDefs: CustomStatDef[]
): (ColumnDefinition | undefined)[] {
  return customStatDefs.map((c) => ({
    id: 'customstat_' + c.shortLabel + c.statHash,
    header: (
      <>
        {c.label}
        <CustomStatWeightsDisplay customStat={c} />
      </>
    ),
    value: (item: DimItem) => item.stats?.find((s) => s.statHash === c.statHash)?.value,
    defaultSort: SortDirection.DESC,
    filter: (value) => `stat:${c.label}:>=${value}`,
    columnGroup: {
      id: c.shortLabel + c.statHash,
      header: c.label,
    },
    limitToClass: c.class === DestinyClass.Unknown ? undefined : c.class,
  }));
}
