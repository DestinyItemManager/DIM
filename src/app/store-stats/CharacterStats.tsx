import { AlertIcon } from 'app/dim-ui/AlertIcon';
import { bungieNetPath } from 'app/dim-ui/BungieImage';
import FractionalPowerLevel from 'app/dim-ui/FractionalPowerLevel';
import { PressTip } from 'app/dim-ui/PressTip';
import { showGearPower } from 'app/gear-power/gear-power';
import { t } from 'app/i18next-t';
import { ArtifactXP } from 'app/inventory/ArtifactXP';
import { ItemPowerSet } from 'app/inventory/ItemPowerSet';
import { profileResponseSelector } from 'app/inventory/selectors';
import type { DimCharacterStat, DimStore } from 'app/inventory/store-types';
import { StorePowerLevel, powerLevelSelector } from 'app/inventory/store/selectors';
import { statTier } from 'app/loadout-builder/utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { getCharacterProgressions } from 'app/progress/selectors';
import { armorStats } from 'app/search/d2-known-values';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import { StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import helmetIcon from '../../../destiny-icons/armor_types/helmet.svg';
import xpIcon from '../../images/xpIcon.svg';
import './CharacterStats.scss';
import StatTooltip from './StatTooltip';

interface CharacterStatProps {
  stats: {
    stat: DimCharacterStat;
  }[];
  showTier?: boolean;
}

function CharacterStats({ stats, showTier }: CharacterStatProps) {
  return (
    <div className="stat-row">
      {showTier && (
        <div className="stat tier">
          {t('LoadoutBuilder.TierNumber', {
            tier: _.sumBy(stats, (s) => statTier(s.stat.value)),
          })}
        </div>
      )}
      {stats.map(({ stat }) => (
        <PressTip key={stat.hash} tooltip={() => <StatTooltip stat={stat} />}>
          <div className="stat" aria-label={`${stat.name} ${stat.value}`} role="group">
            <img src={stat.icon} alt={stat.name} />
            <div>{stat.value}</div>
          </div>
        </PressTip>
      ))}
    </div>
  );
}

function CharacterPower({ stats }: { stats: PowerStat[] }) {
  return (
    <div className={clsx('stat-row', 'powerFormula')}>
      {stats.map((stat) => (
        <PressTip
          key={stat.name}
          tooltip={() => (
            <>
              {stat.name}
              {stat.problems?.hasClassified && `\n\n${t('Loadouts.Classified')}`}
              {stat.richTooltipContent && (
                <>
                  <hr />
                  <div className="richTooltipWrapper">
                    {stat.richTooltipContent()}
                    {(stat.problems?.notEquippable || stat.problems?.notOnStore) && (
                      <div className="tooltipFootnote">
                        {stat.problems.notOnStore ? <AlertIcon /> : '*'}{' '}
                        {t('General.ClickForDetails')}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        >
          <div
            className={clsx('stat', { pointerCursor: stat.onClick })}
            aria-label={`${stat.name} ${stat.value}`}
            role={stat.onClick ? 'button' : 'group'}
            onClick={stat.onClick}
          >
            <img src={stat.icon} alt={stat.name} />
            <div>
              <span className="powerStat">
                <FractionalPowerLevel power={stat.value} />
              </span>
              {stat.problems?.notOnStore ? (
                <AlertIcon className="warningIcon" />
              ) : (
                (stat.problems?.hasClassified || stat.problems?.notEquippable) && (
                  <sup className="asterisk">*</sup>
                )
              )}
            </div>
          </div>
        </PressTip>
      ))}
    </div>
  );
}

interface PowerStat {
  value: number;
  icon: string;
  name: string;
  richTooltipContent?: () => React.ReactNode;
  onClick?: () => void;
  problems?: StorePowerLevel['problems'];
}

export function PowerFormula({ storeId }: { storeId: string }) {
  const defs = useD2Definitions();
  const powerLevel = useSelector((state: RootState) => powerLevelSelector(state, storeId));

  const profileResponse = useSelector(profileResponseSelector);
  const characterProgress = getCharacterProgressions(profileResponse);

  if (!defs || !profileResponse || !powerLevel) {
    return null;
  }

  const maxTotalPower: PowerStat = {
    value: powerLevel.maxTotalPower,
    icon: bungieNetPath(defs.Stat.get(StatHashes.Power).displayProperties.icon),
    name: t('Stats.MaxTotalPower'),
    problems: { ...powerLevel.problems, notOnStore: false },
  };

  const maxGearPower: PowerStat = {
    value: powerLevel.maxGearPower,
    icon: helmetIcon,
    name: t('Stats.MaxGearPowerAll'),
    // used to be t('Stats.MaxGearPower'), a translation i don't want to lose yet
    problems: powerLevel.problems,
    onClick: () => showGearPower(storeId),
    richTooltipContent: () => (
      <ItemPowerSet
        items={powerLevel.highestPowerItems}
        powerFloor={Math.floor(powerLevel.maxGearPower)}
      />
    ),
  };

  // optional chaining here accounts for an edge-case, possible, but type-unadvertised,
  // missing artifact power bonus. please keep this here.
  const bonusPowerProgressionHash =
    profileResponse.profileProgression?.data?.seasonalArtifact?.powerBonusProgression
      ?.progressionHash;

  const artifactPower: PowerStat = {
    value: powerLevel.powerModifier,
    name: t('Stats.PowerModifier'),
    richTooltipContent: () => (
      <ArtifactXP
        characterProgress={characterProgress}
        bonusPowerProgressionHash={bonusPowerProgressionHash}
      />
    ),
    icon: xpIcon,
  };

  return <CharacterPower stats={[maxTotalPower, maxGearPower, artifactPower]} />;
}

export function LoadoutStats({
  stats,
  showTier,
}: {
  stats: DimStore['stats'];
  showTier?: boolean;
}) {
  const statInfos = armorStats
    .map((h) => stats[h])
    .map((stat) => ({
      stat,
      tooltip: <StatTooltip stat={stat} />,
    }));

  return <CharacterStats showTier={showTier} stats={statInfos} />;
}
