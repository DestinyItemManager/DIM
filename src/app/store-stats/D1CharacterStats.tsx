import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import type { DimStore } from 'app/inventory/store-types';
import { getD1CharacterStatTiers, statsWithTiers } from 'app/inventory/store/character-utils';
import { percent } from 'app/shell/formatters';
import clsx from 'clsx';
import { StatHashes } from 'data/d2/generated-enums';
import './CharacterStats.scss';

export default function D1CharacterStats({ stats }: { stats: DimStore['stats'] }) {
  const statList = statsWithTiers.map((h) => stats[h]);
  const tooltips = statList.map((stat) => {
    if (stat) {
      const tier = Math.floor(Math.min(300, stat.value) / 60);
      const next = t('Stats.TierProgress', {
        context: tier === 5 ? 'Max' : '',
        metadata: { context: ['max'] },
        progress: tier === 5 ? stat.value : stat.value % 60,
        tier,
        nextTier: tier + 1,
        statName: stat.displayProperties.name,
      });

      const cooldown = stat.cooldown || '';
      if (cooldown) {
        switch (stat.hash) {
          case StatHashes.Intellect:
            return next + t('Cooldown.Super', { cooldown });
          case StatHashes.Discipline:
            return next + t('Cooldown.Grenade', { cooldown });
          case StatHashes.Strength:
            return next + t('Cooldown.Melee', { cooldown });
        }
      }
      return next;
    }
  });

  return (
    <div className="stat-bars">
      {statList.map((stat, index) => (
        <PressTip key={stat.hash} tooltip={tooltips[index]}>
          <div className="stat">
            <BungieImage src={stat.displayProperties.icon} alt={stat.displayProperties.name} />
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
