import React from 'react';
import { DimCharacterStat, DimStore } from './store-types';
import clsx from 'clsx';
import PressTip from '../dim-ui/PressTip';
import { t } from 'app/i18next-t';
import './dimStats.scss';
import { percent } from '../shell/filters';
import _ from 'lodash';
import { armorStats } from './store/stats';
import { getD1CharacterStatTiers, statsWithTiers } from './store/character-utils';
import { DestinyVersion } from '@destinyitemmanager/dim-api-types';

interface Props {
  stats?: DimStore['stats'];
  destinyVersion: DestinyVersion;
}

export default class CharacterStats extends React.PureComponent<Props> {
  render() {
    const { stats, destinyVersion } = this.props;

    if (!stats) {
      return null;
    }

    if (destinyVersion === 1) {
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
            <PressTip key={stat.hash} tooltip={tooltips[index]}>
              <div className="stat">
                <img src={stat.icon} alt={stat.name} />
                {getD1CharacterStatTiers(stat).map((n, index) => (
                  <div key={index} className="bar">
                    <div
                      className={clsx('progress', {
                        complete: n / 60 === 1
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
    } else {
      const powerTooltip = (stat: DimCharacterStat): string =>
        `${stat.name}${stat.hasClassified ? `\n\n${t('Loadouts.Classified')}` : ''}`;
      const powerInfos = _.compact([
        stats.maxTotalPower,
        stats.maxGearPower,
        stats.powerModifier
      ]).map((stat) => ({ stat, tooltip: powerTooltip(stat) }));

      const statTooltip = (stat: DimCharacterStat): string =>
        `${stat.name}: ${stat.value}
${stat.description}`;
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
                    <PressTip key={stat.hash} tooltip={tooltip}>
                      <div className="stat" aria-label={`${stat.name} ${stat.value}`} role="group">
                        <img src={stat.icon} alt={stat.name} />
                        <div>
                          {stat.value}
                          {stat.hasClassified && <sup>*</sup>}
                        </div>
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
