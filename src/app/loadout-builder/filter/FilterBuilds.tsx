import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { setSetting } from 'app/settings/actions';
import _ from 'lodash';
import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { DimStore } from '../../inventory/store-types';
import { MinMax, MinMaxIgnored, statHashes, StatTypes } from '../types';
import styles from './FilterBuilds.m.scss';
import TierSelect from './TierSelect';

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
  ignoreAffinity,
  maximumEnergy,
  onStatFiltersChanged,
}: {
  statRanges?: { [statType in StatTypes]: MinMax };
  minimumPower: number;
  minimumStatTotal: number;
  selectedStore: DimStore;
  stats: { [statType in StatTypes]: MinMaxIgnored };
  defs: D2ManifestDefinitions;
  order: StatTypes[];
  assumeMasterwork: boolean;
  ignoreAffinity: boolean;
  maximumEnergy: number;
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
        <div className={styles.filterCheckbox} title={t('LoadoutBuilder.AssumeMasterworkDetailed')}>
          <input
            type="checkbox"
            checked={assumeMasterwork}
            onChange={(e) => dispatch(setSetting('loAssumeMasterwork', e.target.checked))}
          />
          <span>{t('LoadoutBuilder.AssumeMasterwork')}</span>
        </div>
        <div className={styles.filterCheckbox} title={t('LoadoutBuilder.IgnoreAffinityDetailed')}>
          <input
            type="checkbox"
            checked={ignoreAffinity}
            onChange={(e) => dispatch(setSetting('loIgnoreAffinity', e.target.checked))}
          />
          <span>{t('LoadoutBuilder.IgnoreAffinity')}</span>
        </div>
        {ignoreAffinity && (
          <div className={styles.filterRange}>
            <label id="maxEnergy" title={t('LoadoutBuilder.SelectMaxEnergyDescription')}>
              {t('LoadoutBuilder.SelectMaxEnergy')}
            </label>
            <RangeSelector
              min={1}
              max={10}
              initialValue={maximumEnergy}
              onChange={(maxEnergy: number) => dispatch(setSetting('loMaxEnergy', maxEnergy))}
            />
          </div>
        )}
        <div className={styles.filterRange}>
          <label id="minPower" title={t('LoadoutBuilder.SelectPowerDescription')}>
            {t('LoadoutBuilder.SelectPower')}
          </label>
          <RangeSelector
            min={750}
            max={parseInt(selectedStore.stats.maxGearPower?.value.toString() ?? '750', 10)}
            initialValue={minimumPower}
            onChange={(minPower: number) => dispatch(setSetting('loMinPower', minPower))}
          />
        </div>
        <div className={styles.filterRange}>
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
