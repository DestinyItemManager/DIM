import React from 'react';
import { D2Store, D1Store } from './store-types';
import clsx from 'clsx';
import PressTip from '../dim-ui/PressTip';
import { t } from 'app/i18next-t';
import './dimStats.scss';
import { percent } from '../shell/filters';

interface Props {
  stats: D1Store['stats'] | D2Store['stats'];
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
    const { stats, destinyVersion } = this.props;

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
      const statList = [
        stats.maxBasePower!,
        stats[2996146975],
        stats[392767087],
        stats[1943323491]
      ];
      const tooltips = statList.map((stat) => {
        if (stat) {
          let tooltip = `${stat.name}: ${stat.value} / ${stat.tierMax}`;
          if (stat.hasClassified) {
            tooltip += `\n\n${t('Loadouts.Classified')}`;
          }
          return tooltip;
        }
      });

      return (
        <div className="stat-bars destiny2">
          {statList.map(
            (stat, index) =>
              stat && (
                <PressTip key={stat.id} tooltip={tooltips[index]}>
                  <div className="stat" aria-label={`${stat.name} ${stat.value}`} role="group">
                    <img src={stat.icon} alt={stat.name} />
                    {stat.tiers && <div>{stat.value}</div>}
                  </div>
                </PressTip>
              )
          )}
        </div>
      );
    }
  }
}
