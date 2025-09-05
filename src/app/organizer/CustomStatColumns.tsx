import { CustomStatDef } from '@destinyitemmanager/dim-api-types';
import CompareStat from 'app/compare/CompareStat';
import { CustomStatWeightsDisplay } from 'app/dim-ui/CustomStatWeights';
import { primitiveComparator } from 'app/utils/comparators';
import { getArmor3TuningStat } from 'app/utils/item-utils';
import { collectRelevantStatHashes } from 'app/utils/stats';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { ColumnDefinition, SortDirection } from './table-types';

export function createCustomStatColumns(
  customStatDefs: CustomStatDef[],
  className?: string,
  headerClassName?: string,
  hideFormula = false,
  withMasterwork = false,
): ColumnDefinition[] {
  return customStatDefs.map((c): ColumnDefinition => {
    const { class: guardianClass, label, shortLabel, statHash, weights } = c;
    const relevantStatHashes = collectRelevantStatHashes(weights);

    return {
      id: `customstat_${shortLabel}${statHash}`,
      header: hideFormula ? (
        label
      ) : (
        <div>
          {label}
          <CustomStatWeightsDisplay customStat={c} />
        </div>
      ),
      className,
      headerClassName,
      value: (item) =>
        item.stats?.find((s) => s.statHash === statHash)?.[
          withMasterwork ? 'baseMasterworked' : 'base'
        ] ?? 0,

      cell: (val, item, ctx) => {
        const stat = item.stats?.find((s) => s.statHash === statHash);
        if (!stat || typeof val !== 'number') {
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
            relevantStatHashes={relevantStatHashes}
          />
        );
      },
      defaultSort: SortDirection.DESC,
      filter: (value) => `stat:${label}:>=${value}`,
      columnGroup: {
        id: shortLabel + statHash,
        header: label,
      },
      limitToClass: guardianClass === DestinyClass.Unknown ? undefined : guardianClass,
      sort: (firstValue, secondValue, firstItem, secondItem) => {
        if (
          typeof firstValue === 'number' &&
          relevantStatHashes.includes(getArmor3TuningStat(firstItem)!)
        ) {
          firstValue += 0.5;
        }
        if (
          typeof secondValue === 'number' &&
          relevantStatHashes.includes(getArmor3TuningStat(secondItem)!)
        ) {
          secondValue += 0.5;
        }
        return primitiveComparator(firstValue, secondValue);
      },
    };
  });
}
