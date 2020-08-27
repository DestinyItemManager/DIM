import React from 'react';
import _ from 'lodash';
import PressTip from 'app/dim-ui/PressTip';
import { AppIcon, faExclamationTriangle, powerIndicatorIcon } from 'app/shell/icons';
import BungieImage from 'app/dim-ui/BungieImage';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import { ArmorSet, statHashes, StatTypes } from '../types';
import { calculateTotalTier, sumEnabledStats } from './utils';
import { t } from 'app/i18next-t';
import { statTier } from '../utils';
import { getPossiblyIncorrectStats } from 'app/utils/item-utils';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import styles from './SetStats.m.scss';

interface Props {
  defs: D2ManifestDefinitions;
  set: ArmorSet;
  statOrder: StatTypes[];
  enabledStats: Set<StatTypes>;
}

function SetStats({ defs, set, statOrder, enabledStats }: Props) {
  const stats = _.mapValues(statHashes, (statHash) => defs.Stat.get(statHash));
  const totalTier = calculateTotalTier(set.stats);
  const enabledTier = sumEnabledStats(set.stats, enabledStats);
  // class items is the only array larger than 1 and it cannot have incorrect stats
  const incorrectStats = _.uniq(set.armor.flatMap((items) => getPossiblyIncorrectStats(items[0])));

  const displayStats = { ...set.stats };

  return (
    <div>
      <span>
        {set.armor.some((items) => items[0].stats?.some((stat) => stat.baseMayBeWrong)) && (
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
