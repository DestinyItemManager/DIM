import React from 'react';
import clsx from 'clsx';
import _ from 'lodash';
import { t } from 'app/i18next-t';
import type { DimStore } from 'app/inventory/store-types';
import PressTip from 'app/dim-ui/PressTip';
import { percent } from 'app/shell/filters';
import { getD1CharacterStatTiers, statsWithTiers } from 'app/inventory/store/character-utils';
import './CharacterStats.scss';

interface Props {
  stats: DimStore['stats'];
}

export default function D1CharacterStats({ stats }: Props) {
  const statList = statsWithTiers.map((h) => stats[h]);
  const tooltips = statList.map((stat) => {
    if (stat) {
      const tier = Math.floor(Math.min(300, stat.value) / 60);
      // t('Stats.TierProgress_Max')
      const next = t('Stats.TierProgress', {
        context: tier === 5 ? 'Max' : '',
        progress: tier === 5 ? stat.value : stat.value % 60,
        tier,
        nextTier: tier + 1,
        statName: stat.name,
      });
      let cooldown = stat.cooldown || '';
      if (cooldown) {
        cooldown = t(`Cooldown.${stat.effect}`, { cooldown });
        // t('Cooldown.Grenade')
        // t('Cooldown.Melee')
        // t('Cooldown.Super')
      }
      return next + cooldown;
    }
  });

  return (
    <div className="stat-bars">
      {statList.map((stat, index) => (
        <PressTip key={stat.hash} tooltip={tooltips[index]}>
          <div className="stat">
            <img src={stat.icon} alt={stat.name} />
            {getD1CharacterStatTiers(stat).map((n, index) => (
              <div key={index} className="bar">
                <div
                  className={clsx('progress', {
                    complete: n / 60 === 1,
                  })}
                  style={{ width: percent(n / 60) }}
                />
              </div>
            ))}
          </div>
        </PressTip>
      ))}
    </div>
  );
}
