import { t } from 'app/i18next-t';
import React, { useCallback, useState } from 'react';
import { D2Store } from '../../inventory/store-types';
import { StatTypes, MinMaxIgnored, MinMax } from '../types';
import TierSelect from './TierSelect';
import _ from 'lodash';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import styles from './FilterBuilds.m.scss';
import { useDispatch } from 'react-redux';
import { setSetting } from 'app/settings/actions';
import { statHashes } from '../types';

/**
 * A control for filtering builds by stats, and controlling the priority order of stats.
 */
export default function FilterBuilds({
  statRanges,
  minimumPower,
  minimumStatTotal,
  selectedStore,
  stats,
  defs,
  order,
  assumeMasterwork,
  onStatFiltersChanged,
}: {
  statRanges?: { [statType in StatTypes]: MinMax };
  minimumPower: number;
  minimumStatTotal: number;
  selectedStore: D2Store;
  stats: { [statType in StatTypes]: MinMaxIgnored };
  defs: D2ManifestDefinitions;
  order: StatTypes[];
  assumeMasterwork: boolean;
  onStatFiltersChanged(stats: { [statType in StatTypes]: MinMaxIgnored }): void;
}) {
  const dispatch = useDispatch();

  const onStatOrderChanged = (sortOrder: StatTypes[]) => {
    dispatch(
      setSetting(
        'loStatSortOrder',
        sortOrder.map((type) => statHashes[type])
      )
    );
  };

  const workingStatRanges =
    statRanges || _.mapValues(statHashes, () => ({ min: 0, max: 10, ignored: false }));

  return (
    <div>
      <div className={styles.filters}>
        <TierSelect
          rowClassName={styles.row}
          stats={stats}
          statRanges={workingStatRanges}
          defs={defs}
          order={order}
          onStatFiltersChanged={onStatFiltersChanged}
          onStatOrderChanged={onStatOrderChanged}
        />
        <div
          className={styles.assumeMasterwork}
          title={t('LoadoutBuilder.AssumeMasterworkDetailed')}
        >
          <input
            type="checkbox"
            checked={assumeMasterwork}
            onChange={(e) => dispatch(setSetting('loAssumeMasterwork', e.target.checked))}
          />
          <span>{t('LoadoutBuilder.AssumeMasterwork')}</span>
        </div>
        <div className={styles.powerSelect}>
          <label id="minPower" title={t('LoadoutBuilder.SelectPowerDescription')}>
            {t('LoadoutBuilder.SelectPower')}
          </label>
          <RangeSelector
            min={750}
            max={parseInt(selectedStore.stats.maxGearPower!.value.toString(), 10)}
            initialValue={minimumPower}
            onChange={(minPower: number) => dispatch(setSetting('loMinPower', minPower))}
          />
        </div>
        <div className={styles.powerSelect}>
          <label id="minStatTotal" title={t('LoadoutBuilder.SelectMinStatTotalDescription')}>
            {t('LoadoutBuilder.SelectMinStatTotal')}
          </label>
          <RangeSelector
            min={40}
            max={82}
            initialValue={minimumStatTotal}
            onChange={(minTotal: number) => dispatch(setSetting('loMinStatTotal', minTotal))}
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
  onChange,
}: {
  min: number;
  max: number;
  initialValue: number;
  onChange(value: number): void;
}) {
  const [value, setValue] = useState(initialValue);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
