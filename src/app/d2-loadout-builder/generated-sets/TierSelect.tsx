import { t } from 'i18next';
import * as React from 'react';
import { StatTypes, MinMax } from '../types';

export default function TierSelect({
  stats,
  onTierChange
}: {
  stats: { [statType in StatTypes]: MinMax };
  onTierChange(stats: { [statType in StatTypes]: MinMax }): void;
}) {
  const handleTierChange = (which: string, changed) => {
    const newTiers = stats;
    if (changed.min) {
      if (changed.min >= newTiers[which].max) {
        newTiers[which].max = changed.min;
      }
      newTiers[which].min = changed.min;
    }
    if (changed.max) {
      if (changed.max <= newTiers[which].min) {
        newTiers[which].min = changed.max;
      }
      newTiers[which].max = changed.max;
    }
    onTierChange(newTiers);
  };

  const tierOptions = [...Array(11).keys()];

  function MinMaxSelect({ stat, type }: { stat: string; type: string }) {
    const lower = type.toLowerCase();
    function handleChange(e) {
      const update = {};
      update[lower] = parseInt(e.target.value, 10);
      handleTierChange(stat, update);
    }

    return (
      <select value={stats[stat][lower]} onChange={handleChange}>
        <option disabled={true}>{t(`LoadoutBuilder.Select${type}`)}</option>
        {tierOptions.map((tier) => (
          <option key={tier}>{tier}</option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex mr4">
      {Object.keys(stats).map((stat) => (
        <div key={stat} className="flex mr4">
          <span className={`icon-stat icon-${stat}`} />
          <span>{t(`LoadoutBuilder.${stat}`)}</span>
          <MinMaxSelect stat={stat} type="Min" />
          <MinMaxSelect stat={stat} type="Max" />
        </div>
      ))}
    </div>
  );
}
