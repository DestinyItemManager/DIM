import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import PressTip from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { AppIcon, faExclamationTriangle, powerIndicatorIcon } from 'app/shell/icons';
import { getPossiblyIncorrectStats } from 'app/utils/item-utils';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { statHashes, StatTypes } from '../types';
import { statTier } from '../utils';
import styles from './SetStats.m.scss';
import { calculateTotalTier, sumEnabledStats } from './utils';

interface Props {
  defs: D2ManifestDefinitions;
  stats: Readonly<{ [statType in StatTypes]: number }>;
  items: DimItem[];
  maxPower: number;
  statOrder: StatTypes[];
  enabledStats: Set<StatTypes>;
  className?: string;
}

function SetStats({ defs, stats, items, maxPower, statOrder, enabledStats, className }: Props) {
  const statsDefs = _.mapValues(statHashes, (statHash) => defs.Stat.get(statHash));
  const totalTier = calculateTotalTier(stats);
  const enabledTier = sumEnabledStats(stats, enabledStats);
  // class items is the only array larger than 1 and it cannot have incorrect stats
  const incorrectStats = _.uniq(items.flatMap((item) => getPossiblyIncorrectStats(item)));

  const displayStats = { ...stats };

  return (
    <div className={clsx(styles.container, className)}>
      <span>
        {items.some((item) => item.stats?.some((stat) => stat.baseMayBeWrong)) && (
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
            stat={statsDefs[stat]}
            value={displayStats[stat]}
          />
        ))}
      </span>
      <span className={styles.light}>
        <AppIcon icon={powerIndicatorIcon} /> {maxPower}
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
