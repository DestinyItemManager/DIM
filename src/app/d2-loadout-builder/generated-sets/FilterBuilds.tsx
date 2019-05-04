import { t } from 'app/i18next-t';
import React, { useMemo, useCallback, useState } from 'react';
import { D2Store } from '../../inventory/store-types';
import { ArmorSet, MinMax, StatTypes } from '../types';
import TierSelect from './TierSelect';
import _ from 'lodash';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';
import styles from './FilterBuilds.m.scss';
import { getPower } from './utils';

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
    const statRanges = {
      Mobility: { min: 10, max: 0 },
      Resilience: { min: 10, max: 0 },
      Recovery: { min: 10, max: 0 }
    };
    for (const set of sets) {
      for (const prop of ['Mobility', 'Resilience', 'Recovery']) {
        statRanges[prop].min = Math.min(set.stats[prop], statRanges[prop].min);
        statRanges[prop].max = Math.max(set.stats[prop], statRanges[prop].max);
      }
    }
    return statRanges;
  }, [sets]);

  const [minPowerStop, maxPowerStop] = useMemo(() => {
    let minPowerStop = selectedStore.stats.maxBasePower!.tierMax!;
    let maxPowerStop = 0;
    for (const set of sets) {
      const power = getPower(set);
      minPowerStop = Math.min(minPowerStop, power);
      maxPowerStop = Math.max(maxPowerStop, power);
    }
    return [minPowerStop, maxPowerStop];
  }, [sets]);

  return (
    <div>
      <h3>{t('LoadoutBuilder.SelectFilters')}</h3>
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
          <label>{t('LoadoutBuilder.SelectPower')}</label>
          <RangeSelector
            min={minPowerStop}
            max={maxPowerStop}
            initialValue={Math.max(minimumPower, minPowerStop)}
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
  const onChangeLive: React.ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    const val = parseInt(e.currentTarget.value, 10);
    setValue(val);
    debouncedOnChange(val);
  }, []);

  return (
    <div>
      <input type="range" min={min} max={max} value={value} onChange={onChangeLive} />
      <input type="number" min={min} max={max} value={value} onChange={onChangeLive} />
    </div>
  );
}
