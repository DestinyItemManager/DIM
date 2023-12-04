import { CustomStatDef } from '@destinyitemmanager/dim-api-types';
import { customStatsSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import { useD2Definitions } from 'app/manifest/selectors';
import { armorStats } from 'app/search/d2-known-values';
import { filterMap } from 'app/utils/collections';
import { addDividers } from 'app/utils/react';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
import styles from './CustomStatWeights.m.scss';

export function CustomStatWeightsFromHash({
  customStatHash,
  className,
}: {
  customStatHash: number;
  className?: string;
}) {
  const customStatsList = useSelector(customStatsSelector);
  const customStat = customStatsList.find((c) => c.statHash === customStatHash);
  if (!customStat) {
    return null;
  }
  return <CustomStatWeightsDisplay className={className} customStat={customStat} />;
}

/**
 * displays the up-to-six stats a custom stat total is comprised of.
 * if the weights are only 0 or 1, it'll just be icons.
 * if some weights are above 1, the stat icons will also include numeric weights.
 */
export function CustomStatWeightsDisplay({
  customStat,
  className,
  singleStatClass,
}: {
  customStat: CustomStatDef;
  className?: string;
  singleStatClass?: string;
}) {
  const defs = useD2Definitions()!;
  // if true, this stat is only include/exclude, no weighting
  const binaryWeights = Object.values(customStat.weights).every((v) => v === 1 || v === 0);
  return (
    <div className={clsx(styles.statWeightRow, className)}>
      {addDividers(
        filterMap(armorStats, (statHash) => {
          const stat = defs.Stat.get(statHash);
          const weight = customStat.weights[statHash] || 0;
          if (!weight) {
            return undefined;
          }
          return (
            <span key={statHash} title={stat.displayProperties.name} className={singleStatClass}>
              <BungieImage
                className="stat-icon"
                title={stat.displayProperties.name}
                src={stat.displayProperties.icon}
              />
              {!binaryWeights && <span>{weight}</span>}
            </span>
          );
        }),
        <span className={styles.divider} />,
      )}
    </div>
  );
}
