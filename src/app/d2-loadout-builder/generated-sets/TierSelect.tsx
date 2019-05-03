import { t } from 'app/i18next-t';
import React from 'react';
import { StatTypes, MinMax } from '../types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';
import { statHashes } from '../process';
import styles from './TierSelect.m.scss';

export default function TierSelect({
  stats,
  statRanges,
  defs,
  onStatFiltersChanged
}: {
  stats: { [statType in StatTypes]: MinMax };
  statRanges: { [statType in StatTypes]: MinMax };
  defs: D2ManifestDefinitions;
  onStatFiltersChanged(stats: { [statType in StatTypes]: MinMax }): void;
}) {
  const handleTierChange = (which: string, changed) => {
    const newTiers = stats;
    if (changed.min !== undefined) {
      if (changed.min >= newTiers[which].max) {
        newTiers[which].max = changed.min;
      }
      newTiers[which].min = changed.min;
    }
    if (changed.max !== undefined) {
      if (changed.max <= newTiers[which].min) {
        newTiers[which].min = changed.max;
      }
      newTiers[which].max = changed.max;
    }

    onStatFiltersChanged(newTiers);
  };

  const tierOptions = [...Array(11).keys()];

  function MinMaxSelect({
    stat,
    type,
    min,
    max
  }: {
    stat: string;
    type: string;
    min: number;
    max: number;
  }) {
    const lower = type.toLowerCase();
    function handleChange(e) {
      const update = {};
      update[lower] = parseInt(e.target.value, 10);
      handleTierChange(stat, update);
    }

    return (
      <select value={stats[stat][lower]} onChange={handleChange}>
        <option disabled={true}>{t(`LoadoutBuilder.Select${type}`)}</option>
        {/*
          t('LoadoutBuilder.SelectMin')
          t('LoadoutBuilder.SelectMax')
         */}
        {tierOptions.map((tier) => (
          <option key={tier} disabled={type === 'Min' ? tier > max : tier < min}>
            {tier}
          </option>
        ))}
      </select>
    );
  }

  const statDefs = {
    Mobility: defs.Stat.get(statHashes.Mobility),
    Resilience: defs.Stat.get(statHashes.Resilience),
    Recovery: defs.Stat.get(statHashes.Recovery)
  };

  return (
    <>
      {Object.keys(stats).map((stat) => (
        <React.Fragment key={stat}>
          <span>
            <span className={styles[`icon${stat}`]} /> {statDefs[stat].displayProperties.name}
          </span>
          <MinMaxSelect
            stat={stat}
            type="Min"
            min={statRanges[stat].min}
            max={statRanges[stat].max}
          />
          <MinMaxSelect
            stat={stat}
            type="Max"
            min={statRanges[stat].min}
            max={statRanges[stat].max}
          />
        </React.Fragment>
      ))}
    </>
  );
}
