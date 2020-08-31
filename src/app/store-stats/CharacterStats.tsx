import React from 'react';
import clsx from 'clsx';
import _ from 'lodash';
import { t } from 'app/i18next-t';
import type { DimCharacterStat, DimStore } from 'app/inventory/store-types';
import FractionalPowerLevel from 'app/dim-ui/FractionalPowerLevel';
import PressTip from 'app/dim-ui/PressTip';
import { showGearPower } from 'app/gear-power/gear-power';
import { armorStats } from 'app/inventory/store/stats';
import './CharacterStats.scss';

interface Props {
  stats: DimStore['stats'];
  storeId?: string;
}

interface CharacterStatProps {
  stats: {
    stat: DimCharacterStat;
    tooltip: React.ReactNode;
  }[];
  storeId?: string;
  className?: string;
}

function CharacterStat({ stats, storeId, className }: CharacterStatProps) {
  return (
    <div className={clsx('stat-row', className)}>
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
            </div>
          </PressTip>
        );
      })}
    </div>
  );
}

export function PowerFormula({ stats, storeId }: Props) {
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

  const statInfos = _.compact([stats.maxTotalPower, stats.maxGearPower, stats.powerModifier]).map(
    (stat) => ({
      stat,
      tooltip: powerTooltip(stat),
    })
  );

  return <CharacterStat stats={statInfos} storeId={storeId} className="powerFormula" />;
}

export function LoadoutStats({ stats, storeId }: Props) {
  const statTooltip = (stat: DimCharacterStat): React.ReactNode =>
    `${stat.name}: ${stat.value}\n${stat.description}`;

  const statInfos = armorStats
    .map((h) => stats[h])
    .map((stat) => ({ stat, tooltip: statTooltip(stat) }));

  return <CharacterStat stats={statInfos} storeId={storeId} />;
}
