import React from 'react';
import _ from 'lodash';
import PressTip from 'app/dim-ui/PressTip';
import { AppIcon, faExclamationTriangle, powerIndicatorIcon } from 'app/shell/icons';
import BungieImage from 'app/dim-ui/BungieImage';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import { ArmorSet, statHashes, LockedArmor2ModMap, StatTypes } from '../types';
import { calculateTotalTier, sumEnabledStats } from './utils';
import { t } from 'app/i18next-t';
import { statTier } from '../utils';
import { Armor2ModPlugCategories, getPossiblyIncorrectStats } from 'app/utils/item-utils';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import styles from './SetStats.m.scss';

interface Props {
  defs: D2ManifestDefinitions;
  set: ArmorSet;
  statOrder: StatTypes[];
  enabledStats: Set<StatTypes>;
  lockedArmor2Mods: LockedArmor2ModMap;
}

function SetStats({ defs, set, statOrder, enabledStats, lockedArmor2Mods }: Props) {
  const stats = _.mapValues(statHashes, (statHash) => defs.Stat.get(statHash));
  const totalTier = calculateTotalTier(set.stats);
  const enabledTier = sumEnabledStats(set.stats, enabledStats);
  const incorrectStats = _.uniq(set.firstValidSet.map(getPossiblyIncorrectStats).flat());

  const displayStats = { ...set.stats };

  // Add general mod vaues for display purposes
  if ($featureFlags.armor2ModPicker) {
    for (const lockedMod of lockedArmor2Mods[Armor2ModPlugCategories.general]) {
      for (const stat of lockedMod.mod.investmentStats) {
        if (stat.statTypeHash === statHashes.Mobility) {
          displayStats.Mobility += stat.value;
        } else if (stat.statTypeHash === statHashes.Recovery) {
          displayStats.Recovery += stat.value;
        } else if (stat.statTypeHash === statHashes.Resilience) {
          displayStats.Resilience += stat.value;
        } else if (stat.statTypeHash === statHashes.Intellect) {
          displayStats.Intellect += stat.value;
        } else if (stat.statTypeHash === statHashes.Discipline) {
          displayStats.Discipline += stat.value;
        } else if (stat.statTypeHash === statHashes.Strength) {
          displayStats.Strength += stat.value;
        }
      }
    }
  }

  return (
    <div>
      <span>
        {set.firstValidSet.some((item) => item.stats?.some((stat) => stat.baseMayBeWrong)) && (
          <PressTip
            elementType="span"
            tooltip={t('LoadoutBuilder.StatIncorrectWarning', {
              stats: incorrectStats.join('/'),
            })}
          >
            <AppIcon className={styles.warning} icon={faExclamationTriangle} />
          </PressTip>
        )}
        <span className={styles.statSegment}>
          <span>
            <b>
              {t('LoadoutBuilder.TierNumber', {
                tier: enabledTier,
              })}
            </b>
          </span>
          {enabledTier !== totalTier && (
            <span className={styles.nonActiveStat}>
              <b>
                {` (${t('LoadoutBuilder.TierNumber', {
                  tier: totalTier,
                })})`}
              </b>
            </span>
          )}
        </span>
        {statOrder.map((stat) => (
          <Stat
            key={stat}
            isActive={enabledStats.has(stat)}
            stat={stats[stat]}
            value={displayStats[stat]}
          />
        ))}
      </span>
      <span className={styles.light}>
        <AppIcon icon={powerIndicatorIcon} /> {set.maxPower}
      </span>
    </div>
  );
}

function Stat({
  stat,
  isActive,
  value,
}: {
  stat: DestinyStatDefinition;
  isActive: boolean;
  value: number;
}) {
  return (
    <span
      className={isActive ? styles.statSegment : `${styles.statSegment} ${styles.nonActiveStat}`}
    >
      <b>
        {t('LoadoutBuilder.TierNumber', {
          tier: statTier(value),
        })}
      </b>{' '}
      <BungieImage src={stat.displayProperties.icon} /> {stat.displayProperties.name}
    </span>
  );
}

export default SetStats;
