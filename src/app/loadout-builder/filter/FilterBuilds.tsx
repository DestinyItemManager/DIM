import { useSetSetting } from 'app/settings/hooks';
import { StatHashes } from 'data/d2/generated-enums';
import React from 'react';
import { ArmorStatHashes, StatFilters, StatRanges } from '../types';
import styles from './FilterBuilds.m.scss';
import TierSelect from './TierSelect';

export const defaultStatRanges: Readonly<StatRanges> = {
  [StatHashes.Mobility]: { min: 0, max: 10 },
  [StatHashes.Resilience]: { min: 0, max: 10 },
  [StatHashes.Recovery]: { min: 0, max: 10 },
  [StatHashes.Discipline]: { min: 0, max: 10 },
  [StatHashes.Intellect]: { min: 0, max: 10 },
  [StatHashes.Strength]: { min: 0, max: 10 },
};

/**
 * A control for filtering builds by stats, and controlling the priority order of stats.
 */
export default function FilterBuilds({
  statRanges,
  stats,
  order,
  onStatFiltersChanged,
}: {
  statRanges?: Readonly<StatRanges>;
  stats: StatFilters;
  order: ArmorStatHashes[]; // stat hashes in user order
  onStatFiltersChanged(stats: StatFilters): void;
}) {
  const setSetting = useSetSetting();

  const onStatOrderChanged = (sortOrder: ArmorStatHashes[]) =>
    setSetting('loStatSortOrder', sortOrder);

  const workingStatRanges = statRanges || defaultStatRanges;

  return (
    <div>
      <div className={styles.filters}>
        <TierSelect
          rowClassName={styles.row}
          stats={stats}
          statRanges={workingStatRanges}
          order={order}
          onStatFiltersChanged={onStatFiltersChanged}
          onStatOrderChanged={onStatOrderChanged}
        />
      </div>
    </div>
  );
}
