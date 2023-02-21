import { CustomStatDef } from '@destinyitemmanager/dim-api-types';
import { CustomStatWeightsDisplay } from 'app/dim-ui/CustomStatWeights';
import { DimItem } from 'app/inventory/item-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { ColumnDefinition, SortDirection } from './table-types';

export function createCustomStatColumns(
  customStatDefs: CustomStatDef[],
  classType: DestinyClass
): (ColumnDefinition | undefined)[] {
  return customStatDefs.map((c) => {
    if (c.class === classType || c.class === DestinyClass.Unknown) {
      return {
        id: c.shortLabel + c.statHash,
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
      };
    }
  });
}
