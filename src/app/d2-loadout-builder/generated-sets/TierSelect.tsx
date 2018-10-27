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

  return (
    <div className="flex mr4">
      {Object.keys(stats).map((stat) => (
        <div key={stat} className="flex mr4">
          <span className={`icon-stat icon-${stat}`} />
          <span>{t(`LoadoutBuilder.${stat}`)}</span>
          <select
            value={stats[stat].min}
            onChange={(e) => handleTierChange(stat, { min: parseInt(e.target.value, 10) })}
          >
            <option disabled={true}>{t('LoadoutBuilder.SelectMin')}</option>
            {[...Array(11).keys()].map((tier) => (
              <option key={tier}>{tier}</option>
            ))}
          </select>

          <select
            value={stats[stat].max}
            onChange={(e) => handleTierChange(stat, { max: parseInt(e.target.value, 10) })}
          >
            <option disabled={true}>{t('LoadoutBuilder.SelectMax')}</option>
            {[...Array(11).keys()].map((tier) => (
              <option key={tier}>{tier}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
