import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, powerIndicatorIcon } from 'app/shell/icons';
import StatTooltip from 'app/store-stats/StatTooltip';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { ArmorStatHashes, ArmorStats } from '../types';
import { remEuclid, statTierWithHalf } from '../utils';
import styles from './SetStats.m.scss';
import { calculateTotalTier, sumEnabledStats } from './utils';

interface Props {
  stats: ArmorStats;
  maxPower: number;
  statOrder: ArmorStatHashes[];
  enabledStats: Set<ArmorStatHashes>;
  className?: string;
  existingLoadoutName?: string;
}

/**
 * Displays the overall tier and per-stat tier of a set.
 */
function SetStats({
  stats,
  maxPower,
  statOrder,
  enabledStats,
  className,
  existingLoadoutName,
}: Props) {
  const defs = useD2Definitions()!;
  const statDefs: { [statHash: number]: DestinyStatDefinition } = {};
  for (const statHash of statOrder) {
    statDefs[statHash] = defs.Stat.get(statHash);
  }
  const totalTier = calculateTotalTier(stats);
  const enabledTier = sumEnabledStats(stats, enabledStats);

  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.tierLightContainer}>
        <span className={clsx(styles.tier, styles.tierLightSegment)}>
          {t('LoadoutBuilder.TierNumber', {
            tier: enabledTier,
          })}
        </span>
        {enabledTier !== totalTier && (
          <span className={clsx(styles.tier, styles.nonActiveStat)}>
            {` (${t('LoadoutBuilder.TierNumber', {
              tier: totalTier,
            })})`}
          </span>
        )}
        <span className={styles.light}>
          <AppIcon icon={powerIndicatorIcon} className={clsx(styles.statIcon)} /> {maxPower}
        </span>
        {existingLoadoutName ? (
          <span className={styles.existingLoadout}>
            {t('LoadoutBuilder.ExistingLoadout')}:{' '}
            <span className={styles.loadoutName}>{existingLoadoutName}</span>
          </span>
        ) : null}
      </div>
      <div className={styles.statSegmentContainer}>
        {statOrder.map((statHash) => (
          <PressTip
            key={statHash}
            tooltip={() => (
              <StatTooltip
                stat={{
                  hash: statHash,
                  name: statDefs[statHash].displayProperties.name,
                  value: stats[statHash],
                  description: statDefs[statHash].displayProperties.description,
                }}
              />
            )}
          >
            <Stat
              isActive={enabledStats.has(statHash)}
              stat={statDefs[statHash]}
              value={stats[statHash]}
            />
          </PressTip>
        ))}
      </div>
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
      className={clsx(styles.statSegment, {
        [styles.nonActiveStat]: !isActive,
      })}
    >
      <span
        className={clsx(styles.tier, {
          [styles.halfTierValue]: isActive && remEuclid(value, 10) >= 5,
        })}
      >
        {t('LoadoutBuilder.TierNumber', {
          tier: statTierWithHalf(value),
        })}
      </span>
      <BungieImage className={clsx(styles.statIcon)} src={stat.displayProperties.icon} />{' '}
      {stat.displayProperties.name}
    </span>
  );
}

export default SetStats;
