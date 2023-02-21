import { CustomStatDef } from '@destinyitemmanager/dim-api-types';
import { normalizedCustomStatsSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import { useD2Definitions } from 'app/manifest/selectors';
import { armorStats } from 'app/search/d2-known-values';
import clsx from 'clsx';
import React, { ReactElement, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import styles from './CustomStatWeights.m.scss';

export function CustomStatWeightsFromHash({
  customStatHash,
  className,
}: {
  customStatHash: number;
  className?: string;
}) {
  const customStatsList = useSelector(normalizedCustomStatsSelector);
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
        armorStats
          .map((statHash) => {
            const stat = defs.Stat.get(statHash);
            const weight = customStat.weights[statHash] || 0;
            if (!weight) {
              return null;
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
          })
          .filter(Boolean),
        <span className={styles.divider} />
      )}
    </div>
  );
}

/** places a divider between each element of arr */
function addDividers<T extends React.ReactNode>(arr: T[], divider: ReactElement): ReactNode[] {
  return arr.flatMap((e, i) => [
    i ? React.cloneElement(divider, { key: `divider-${i}` }) : null,
    e,
  ]);
}
