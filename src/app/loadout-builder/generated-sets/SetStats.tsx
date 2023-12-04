import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, powerIndicatorIcon } from 'app/shell/icons';
import StatTooltip from 'app/store-stats/StatTooltip';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import { ArmorStatHashes, ArmorStats, ModStatChanges, ResolvedStatConstraint } from '../types';
import { remEuclid, statTier, statTierWithHalf } from '../utils';
import styles from './SetStats.m.scss';
import { calculateTotalTier, sumEnabledStats } from './utils';

/**
 * Displays the overall tier and per-stat tier of a generated loadout set.
 */
// TODO: would be a lot easier if this was just passed a Loadout or FullyResolvedLoadout...
export function SetStats({
  stats,
  getStatsBreakdown,
  maxPower,
  resolvedStatConstraints,
  boostedStats,
  className,
  existingLoadoutName,
  equippedHashes,
  autoStatMods,
}: {
  stats: ArmorStats;
  getStatsBreakdown: () => ModStatChanges;
  maxPower: number;
  resolvedStatConstraints: ResolvedStatConstraint[];
  boostedStats: Set<ArmorStatHashes>;
  className?: string;
  existingLoadoutName?: string;
  equippedHashes: Set<number>;
  autoStatMods: boolean;
}) {
  const defs = useD2Definitions()!;
  const totalTier = calculateTotalTier(stats);
  const enabledTier = sumEnabledStats(
    stats,
    resolvedStatConstraints.filter((c) => !c.ignored),
  );

  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.tierLightContainer}>
        <TotalTier enabledTier={enabledTier} totalTier={totalTier} />
      </div>
      {resolvedStatConstraints.map((c) => {
        const statHash = c.statHash as ArmorStatHashes;
        const statDef = defs.Stat.get(statHash);
        const value = stats[statHash];
        return (
          <PressTip
            key={statHash}
            tooltip={() => (
              <StatTooltip
                stat={{
                  hash: statHash,
                  name: statDef.displayProperties.name,
                  value,
                  description: statDef.displayProperties.description,
                  breakdown: getStatsBreakdown()[statHash].breakdown,
                }}
                equippedHashes={equippedHashes}
              />
            )}
          >
            <Stat
              isActive={!c.ignored}
              isBoosted={boostedStats.has(statHash)}
              stat={statDef}
              value={value}
              showHalfStat={!autoStatMods}
            />
          </PressTip>
        );
      })}
      <span className={styles.light}>
        <AppIcon icon={powerIndicatorIcon} />
        {maxPower}
      </span>
      {existingLoadoutName ? (
        <span className={styles.existingLoadout}>
          {t('LoadoutBuilder.ExistingLoadout')}:{' '}
          <span className={styles.loadoutName}>{existingLoadoutName}</span>
        </span>
      ) : null}
    </div>
  );
}

function Stat({
  stat,
  isActive,
  isBoosted,
  value,
  showHalfStat,
}: {
  stat: DestinyStatDefinition;
  isActive: boolean;
  isBoosted: boolean;
  value: number;
  showHalfStat: boolean;
}) {
  const isHalfTier = showHalfStat && isActive && remEuclid(value, 10) >= 5;
  return (
    <span
      className={clsx(styles.statSegment, {
        [styles.nonActiveStat]: !isActive,
      })}
    >
      <BungieImage className={styles.statIcon} src={stat.displayProperties.icon} />
      <span
        className={clsx(styles.tier, {
          [styles.halfTierValue]: isHalfTier,
          [styles.boostedValue]: !isHalfTier && isBoosted,
        })}
      >
        {t('LoadoutBuilder.TierNumber', {
          tier: showHalfStat ? statTierWithHalf(value) : statTier(value),
        })}
      </span>
    </span>
  );
}

function TotalTier({ totalTier, enabledTier }: { totalTier: number; enabledTier: number }) {
  return (
    <>
      <span className={styles.tier}>
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
    </>
  );
}

export function ReferenceTiers({
  resolvedStatConstraints,
}: {
  resolvedStatConstraints: ResolvedStatConstraint[];
}) {
  const defs = useD2Definitions()!;
  const totalTier = _.sumBy(resolvedStatConstraints, (c) => c.minTier);
  const enabledTier = _.sumBy(resolvedStatConstraints, (c) => (c.ignored ? 0 : c.minTier));

  return (
    <div className={styles.container}>
      <TotalTier enabledTier={enabledTier} totalTier={totalTier} />
      {resolvedStatConstraints.map((c) => {
        const statHash = c.statHash as ArmorStatHashes;
        const statDef = defs.Stat.get(statHash);
        const tier = c.minTier;
        return (
          <span
            key={statHash}
            className={clsx(styles.statSegment, {
              [styles.nonActiveStat]: c.ignored,
            })}
          >
            <BungieImage className={styles.statIcon} src={statDef.displayProperties.icon} />
            <span className={styles.tier}>
              {t('LoadoutBuilder.TierNumber', {
                tier,
              })}
            </span>
          </span>
        );
      })}
    </div>
  );
}
