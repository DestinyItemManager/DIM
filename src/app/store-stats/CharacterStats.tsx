import React from 'react';
import clsx from 'clsx';
import _ from 'lodash';
import { t } from 'app/i18next-t';
import type { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import type { DimCharacterStat, DimStore } from 'app/inventory/store-types';
import FractionalPowerLevel from 'app/dim-ui/FractionalPowerLevel';
import PressTip from 'app/dim-ui/PressTip';
import { percent } from 'app/shell/filters';
import { showGearPower } from 'app/gear-power/gear-power';
import { armorStats } from 'app/inventory/store/stats';
import { getD1CharacterStatTiers, statsWithTiers } from 'app/inventory/store/character-utils';
import './CharacterStats.scss';

interface Props {
  stats?: DimStore['stats'];
  destinyVersion: DestinyVersion;
  storeId?: string;
}

function CharacterStat({ stat }: { stat: DimCharacterStat }) {
  return (
    <>
      <img src={stat.icon} alt={stat.name} />
      <div>
        {stat.hash < 0 ? (
          <span className="powerStat">
            <FractionalPowerLevel power={stat.value} />
          </span>
        ) : (
          stat.value
        )}
        {(stat.hasClassified || stat.differentEquippableMaxGearPower) && (
          <sup className="asterisk">*</sup>
        )}
      </div>
    </>
  );
}

/**
 * Render the character information: Max Power/Stat points.
 * May want to consider splitting D1 from D2 at some point.
 */
function CharacterStats({ stats, destinyVersion, storeId }: Props) {
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
  } else {
    const powerTooltip = (stat: DimCharacterStat): React.ReactNode => (
      <>
        {`${stat.name}${stat.hasClassified ? `\n\n${t('Loadouts.Classified')}` : ''}`}
        {stat.richTooltip && (
          <>
            <hr />
            <div className="richTooltipWrapper">
              {stat.richTooltip}
              {stat.differentEquippableMaxGearPower && (
                <div className="tooltipFootnote">* {t('General.ClickForDetails')}</div>
              )}
            </div>
          </>
        )}
      </>
    );
    const powerInfos: {
      stat: DimCharacterStat;
      tooltip: React.ReactNode;
    }[] = _.compact([stats.maxTotalPower, stats.maxGearPower, stats.powerModifier]).map((stat) => ({
      stat,
      tooltip: powerTooltip(stat),
    }));

    const statTooltip = (stat: DimCharacterStat): React.ReactNode =>
      `${stat.name}: ${stat.value}\n${stat.description}`;
    const statInfos: {
      stat: DimCharacterStat;
      tooltip: React.ReactNode;
    }[] = armorStats.map((h) => stats[h]).map((stat) => ({ stat, tooltip: statTooltip(stat) }));

    return (
      <div className="stat-bars destiny2">
        {[powerInfos, statInfos].map((stats, index) => (
          <div key={index} className="stat-row">
            {stats.map(({ stat, tooltip }) => {
              // if this is the "max gear power" stat (hash -3),
              // add in an onClick and an extra class
              const isMaxGearPower = stat.hash === -3 && storeId;

              return (
                <PressTip key={stat.hash} tooltip={tooltip} allowClickThrough={true}>
                  <div
                    className={clsx('stat', { pointerCursor: isMaxGearPower })}
                    aria-label={`${stat.name} ${stat.value}`}
                    role={isMaxGearPower ? 'button' : 'group'}
                    onClick={
                      isMaxGearPower
                        ? () => {
                            showGearPower(storeId!);
                          }
                        : undefined
                    }
                  >
                    <CharacterStat stat={stat} />
                  </div>
                </PressTip>
              );
            })}
          </div>
        ))}
      </div>
    );
  }
}

export default React.memo(CharacterStats);
