import { t } from 'app/i18next-t';
import React, { useMemo } from 'react';
import { D2Store } from '../../inventory/store-types';
import { ArmorSet, MinMax, StatTypes } from '../types';
import TierSelect from './TierSelect';
import _ from 'lodash';

export default function FilterBuilds({
  sets,
  minimumPower,
  useBaseStats,
  selectedStore,
  stats,
  onUseBaseStatsChanged,
  onMinimumPowerChanged,
  onStatFiltersChanged
}: {
  sets: ArmorSet[];
  minimumPower: number;
  useBaseStats: boolean;
  selectedStore: D2Store;
  stats: { [statType in StatTypes]: MinMax };
  onUseBaseStatsChanged(useBaseStats: boolean): void;
  onMinimumPowerChanged(minimumPower: number): void;
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

  const powerLevelOptions = useMemo(
    () => _.range(selectedStore.stats.maxBasePower!.tierMax || 0, -1, -1),
    [selectedStore]
  );

  const setMinimumPower: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    onMinimumPowerChanged(parseInt(event.target.value, 10));
  };

  const setUseBaseStats: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    onUseBaseStatsChanged(event.target.checked);
  };

  return (
    <div>
      <h3>{t('LoadoutBuilder.SelectFilters')}</h3>
      <div className="flex loadout-builder-row space-between">
        <div className="mr4">
          <input
            id="useBaseStats"
            type="checkbox"
            onChange={setUseBaseStats}
            checked={useBaseStats}
          />
          <label htmlFor="useBaseStats">{t('LoadoutBuilder.UseBaseStats')}</label>
        </div>
        <TierSelect
          stats={stats}
          statRanges={statRanges}
          onStatFiltersChanged={onStatFiltersChanged}
        />
        <div className="mr4">
          <span>{t('LoadoutBuilder.SelectPower')}</span>
          <select value={minimumPower} onChange={setMinimumPower}>
            {powerLevelOptions.map((power) => {
              if (power === 0) {
                return (
                  <option value={0} key={power}>
                    {t('LoadoutBuilder.SelectPowerMinimum')}
                  </option>
                );
              }
              return <option key={power}>{power}</option>;
            })}
          </select>
        </div>
      </div>
    </div>
  );
}
