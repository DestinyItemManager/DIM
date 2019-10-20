import { t } from 'app/i18next-t';
import React, { useMemo, useCallback, useState } from 'react';
import { D2Store } from '../../inventory/store-types';
import { ArmorSet, MinMax, StatTypes } from '../types';
import TierSelect from './TierSelect';
import _ from 'lodash';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import styles from './FilterBuilds.m.scss';
import { statHashes, statKeys } from '../process';
import { statTier } from './utils';

/**
 * A control for filtering builds by stats, and controlling the priority order of stats.
 */
export default function FilterBuilds({
  sets,
  minimumPower,
  selectedStore,
  stats,
  defs,
  order,
  onMinimumPowerChanged,
  onStatOrderChanged,
  onStatFiltersChanged
}: {
  sets: readonly ArmorSet[];
  minimumPower: number;
  selectedStore: D2Store;
  stats: { [statType in StatTypes]: MinMax };
  defs: D2ManifestDefinitions;
  order: StatTypes[];
  onMinimumPowerChanged(minimumPower: number): void;
  onStatOrderChanged(order: StatTypes[]): void;
  onStatFiltersChanged(stats: { [statType in StatTypes]: MinMax }): void;
}) {
  const statRanges = useMemo(() => {
    const statRanges = _.mapValues(statHashes, () => ({ min: 10, max: 0 }));
    for (const set of sets) {
      for (const prop of statKeys) {
        const tier = statTier(set.stats[prop]);
        const range = statRanges[prop];
        range.min = Math.min(tier, range.min);
        range.max = Math.max(tier, range.max);
      }
    }
    return statRanges;
  }, [sets]);

  return (
    <div>
      <div className={styles.filters}>
        <TierSelect
          rowClassName={styles.row}
          stats={stats}
          statRanges={statRanges}
          defs={defs}
          order={order}
          onStatFiltersChanged={onStatFiltersChanged}
          onStatOrderChanged={onStatOrderChanged}
        />
        <div className={styles.powerSelect}>
          <label id="minPower" title={t('LoadoutBuilder.SelectPowerDescription')}>
            {t('LoadoutBuilder.SelectPower')}
          </label>
          <RangeSelector
            min={750}
            max={selectedStore.stats.maxTotalPower!.tierMax!}
            initialValue={minimumPower}
            onChange={onMinimumPowerChanged}
          />
        </div>
      </div>
    </div>
  );
}

function RangeSelector({
  min,
  max,
  initialValue,
  onChange
}: {
  min: number;
  max: number;
  initialValue: number;
  onChange(value: number): void;
}) {
  const [value, setValue] = useState(initialValue);
  const debouncedOnChange = useCallback(_.debounce(onChange, 500), [onChange]);
  const clampedValue = Math.max(min, Math.min(value, max));
  const onChangeLive: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const val = parseInt(e.currentTarget.value, 10);
      setValue(val);
      debouncedOnChange(val);
    },
    [debouncedOnChange]
  );

  return (
    <div>
      <input
        aria-labelledby="minPower"
        type="range"
        min={min}
        max={max}
        value={clampedValue}
        onChange={onChangeLive}
      />
      <input
        aria-labelledby="minPower"
        type="number"
        min={min}
        max={max}
        value={clampedValue}
        onChange={onChangeLive}
      />
    </div>
  );
}
