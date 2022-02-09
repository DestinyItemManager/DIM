import FractionalPowerLevel from 'app/dim-ui/FractionalPowerLevel';
import PressTip from 'app/dim-ui/PressTip';
import { showGearPower } from 'app/gear-power/gear-power';
import { t } from 'app/i18next-t';
import type { DimCharacterStat, DimStore } from 'app/inventory/store-types';
import { statTier } from 'app/loadout-builder/utils';
import { armorStats } from 'app/search/d2-known-values';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import './CharacterStats.scss';
import StatTooltip from './StatTooltip';

interface CharacterStatProps {
  stats: {
    stat: DimCharacterStat;
    tooltip: React.ReactNode;
  }[];
  storeId?: string;
  className?: string;
  showTier?: boolean;
}

function CharacterStat({ stats, storeId, className, showTier }: CharacterStatProps) {
  return (
    <div className={clsx('stat-row', className)}>
      {showTier && (
        <div className="stat tier">
          {t('LoadoutBuilder.TierNumber', {
            tier: _.sumBy(stats, (s) => statTier(s.stat.value)),
          })}
        </div>
      )}
      {stats.map(({ stat, tooltip }) => {
        // if this is the "max gear power" stat (hash -3),
        // add in an onClick and an extra class
        const isMaxGearPower = stat.hash === -3 && storeId;

        return (
          <PressTip key={stat.hash} tooltip={tooltip}>
            <div
              className={clsx('stat', { pointerCursor: isMaxGearPower })}
              aria-label={`${stat.name} ${stat.value}`}
              role={isMaxGearPower ? 'button' : 'group'}
              onClick={
                isMaxGearPower
                  ? () => {
                      showGearPower(storeId);
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

export function PowerFormula({ stats, storeId }: { stats: DimStore['stats']; storeId?: string }) {
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

export function LoadoutStats({
  stats,
  storeId,
  characterClass,
  showTier,
}: {
  stats: DimStore['stats'];
  /** Store is optional because in the loadout drawer we don't have a specific store */
  storeId?: string;
  characterClass: DestinyClass; // this can be DestinyClass.Unknown
  showTier?: boolean;
}) {
  const statInfos = armorStats
    .map((h) => stats[h])
    .map((stat) => ({
      stat,
      tooltip: <StatTooltip stat={stat} characterClass={characterClass} />,
    }));

  return <CharacterStat showTier={showTier} stats={statInfos} storeId={storeId} />;
}
