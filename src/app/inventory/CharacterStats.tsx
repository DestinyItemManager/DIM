import React from 'react';
import { D2Store, D1Store, D2CharacterStat, DimStore } from './store-types';
import clsx from 'clsx';
import PressTip from '../dim-ui/PressTip';
import { t } from 'app/i18next-t';
import './dimStats.scss';
import { percent } from '../shell/filters';
import _ from 'lodash';
import { armorStats } from './store/stats';

interface Props {
  stats?: D1Store['stats'] | D2Store['stats'];
  store?: DimStore;
  destinyVersion: 1 | 2;
}

function isD1Stats(
  _stats: D1Store['stats'] | D2Store['stats'],
  destinyVersion: 1 | 2
): _stats is D1Store['stats'] {
  return destinyVersion === 1;
}

export default class CharacterStats extends React.PureComponent<Props> {
  render() {
    const { stats, store, destinyVersion } = this.props;

    const equipStats: { [statHash: number]: number } = {};

    // Workaround for https://github.com/Bungie-net/api/issues/1093
    if (store) {
      // calc stats from store equipped
      for (const item of store.items) {
        if (item.bucket.inArmor && item.equipped && item.stats) {
          for (const stat of item.stats) {
            equipStats[stat.statHash] = (equipStats[stat.statHash] || 0) + stat.value;
          }
        }
      }
    }

    if (!stats) {
      return null;
    }

    // TODO: Remove tooltip from stats definitions

    if (isD1Stats(stats, destinyVersion)) {
      const statList = [stats.STAT_INTELLECT, stats.STAT_DISCIPLINE, stats.STAT_STRENGTH];
      const tooltips = statList.map((stat) => {
        if (stat) {
          const tier = stat.tier || 0;
          // t('Stats.TierProgress_Max')
          const next = t('Stats.TierProgress', {
            context: tier === 5 ? 'Max' : '',
            progress: tier === 5 ? stat.value : stat.value % 60,
            tier,
            nextTier: tier + 1,
            statName: stat.name
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
            <PressTip key={stat.name || stat.id} tooltip={tooltips[index]}>
              <div className="stat">
                <img src={stat.icon} alt={stat.name} />
                {stat.tiers &&
                  stat.tiers.map((n, index) => (
                    <div key={index} className="bar">
                      <div
                        className={clsx('progress', {
                          complete: destinyVersion === 2 || n / stat.tierMax! === 1
                        })}
                        style={{ width: percent(n / stat.tierMax!) }}
                      />
                    </div>
                  ))}
              </div>
            </PressTip>
          ))}
        </div>
      );
    } else {
      const powerInfos = [
        { stat: stats.maxTotalPower, tooltip: t('Stats.MaxTotalPower') },
        { stat: stats.maxGearPower, tooltip: t('Stats.MaxGearPower') },
        { stat: stats.powerModifier, tooltip: t('Stats.PowerModifier') }
      ];

      const statTooltip = (stat: D2CharacterStat): string =>
        `${stat.name}: ${equipStats[stat.id] || stat.value} / ${stat.tierMax}
${stat.description}${stat.hasClassified ? `\n\n${t('Loadouts.Classified')}` : ''}`;

      const statInfos = armorStats
        .map((h) => stats[h])
        .map((stat) => ({ stat, tooltip: statTooltip(stat) }));

      return (
        <div className="stat-bars destiny2">
          {[powerInfos, statInfos].map((stats, index) => (
            <div key={index} className="stat-row">
              {stats.map(
                ({ stat, tooltip }) =>
                  stat && (
                    <PressTip key={stat.id} tooltip={tooltip}>
                      <div className="stat" aria-label={`${stat.name} ${stat.value}`} role="group">
                        <img src={stat.icon} alt={stat.name} />
                        {stat.tiers && <div>{equipStats[stat.id] || stat.value}</div>}
                      </div>
                    </PressTip>
                  )
              )}
            </div>
          ))}
        </div>
      );
    }
  }
}
