import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import type { DimStore } from 'app/inventory/store-types';
import { getD1CharacterStatTiers, statsWithTiers } from 'app/inventory/store/character-utils';
import { percent } from 'app/shell/formatters';
import clsx from 'clsx';
import './CharacterStats.m.scss';
import styles from './D1CharacterStats.m.scss';

interface Props {
  stats: DimStore['stats'];
}

export default function D1CharacterStats({ stats }: Props) {
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
        statName: stat.name,
      });

      let cooldown = stat.cooldown || '';
      if (cooldown) {
        cooldown = t(`Cooldown.${stat.effect!}`, {
          cooldown,
          metadata: { keys: 'cooldowns' },
        });
      }
      return next + cooldown;
    }
  });

  return (
    <div className="stat-bars">
      {statList.map((stat, index) => (
        <PressTip key={stat.hash} tooltip={tooltips[index]}>
          <div className="stat">
            <BungieImage src={stat.icon} alt={stat.name} />
            {getD1CharacterStatTiers(stat).map((n, index) => (
              <div key={index} className={styles.bar}>
                <div
                  className={clsx(styles.progress, {
                    [styles.complete]: n / 60 === 1,
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
