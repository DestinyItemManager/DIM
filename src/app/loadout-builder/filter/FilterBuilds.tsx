import { useSetSetting } from 'app/settings/hooks';
import React from 'react';
import { defaultStatFilters } from '../loadout-builder-reducer';
import { ArmorStatHashes, MinMax, MinMaxIgnored } from '../types';
import styles from './FilterBuilds.m.scss';
import TierSelect from './TierSelect';

/**
 * A control for filtering builds by stats, and controlling the priority order of stats.
 */
export default function FilterBuilds({
  statRanges,
  stats,
  order,
  onStatFiltersChanged,
}: {
  statRanges?: { [statHash in ArmorStatHashes]: MinMax };
  stats: { [statHash in ArmorStatHashes]: MinMaxIgnored };
  order: number[]; // stat hashes in user order
  onStatFiltersChanged(stats: { [statHash in ArmorStatHashes]: MinMaxIgnored }): void;
}) {
  const setSetting = useSetSetting();

  const onStatOrderChanged = (sortOrder: number[]) => setSetting('loStatSortOrder', sortOrder);

  const workingStatRanges = statRanges || defaultStatFilters;

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
