import { t } from 'app/i18next-t';
import React from 'react';
import { StatTypes, MinMax } from '../types';

export default function TierSelect({
  stats,
  statRanges,
  onStatFiltersChanged
}: {
  stats: { [statType in StatTypes]: MinMax };
  statRanges: { [statType in StatTypes]: MinMax };
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

  return (
    <div className="stat-filters">
      {Object.keys(stats).map((stat) => (
        <div key={stat} className="flex mr4">
          <span className={`icon-stat icon-${stat}`} />
          <span>{t(`LoadoutBuilder.${stat}`)}</span>
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
        </div>
      ))}
    </div>
  );
}
