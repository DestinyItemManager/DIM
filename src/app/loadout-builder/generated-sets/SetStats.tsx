import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { MAX_STAT } from 'app/loadout/known-values';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, powerIndicatorIcon } from 'app/shell/icons';
import StatTooltip from 'app/store-stats/StatTooltip';
import { sumBy } from 'app/utils/collections';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { sum } from 'es-toolkit';
import {
  ArmorStatHashes,
  ArmorStats,
  DesiredStatRange,
  ModStatChanges,
  ResolvedStatConstraint,
} from '../types';
import styles from './SetStats.m.scss';
import { sumEnabledStats } from './utils';

/**
 * Displays the overall stats and per-stat stat of a generated loadout set.
 */
// TODO: would be a lot easier if this was just passed a Loadout or FullyResolvedLoadout...
export function TierlessSetStats({
  stats,
  getStatsBreakdown,
  maxPower,
  desiredStatRanges,
  boostedStats,
  className,
  existingLoadoutName,
  equippedHashes,
}: {
  stats: ArmorStats;
  getStatsBreakdown: () => ModStatChanges;
  maxPower: number;
  desiredStatRanges: DesiredStatRange[];
  boostedStats: Set<ArmorStatHashes>;
  className?: string;
  existingLoadoutName?: string;
  equippedHashes: Set<number>;
}) {
  const defs = useD2Definitions()!;
  const totalStats = sum(Object.values(stats)); // TODO: Is this useful?
  const countedStatsTotal = sumEnabledStats(stats, desiredStatRanges); // Total of the stats that were within the desired ranges

  // TODO: Lots of changes needed here once we drop tiers. Maybe we just show a
  // total stat sum? Doesn't seem that useful...
  // TODO: Highlight enhanced stats?

  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.tierLightContainer}>
        <TotalStats enabledStats={countedStatsTotal} totalStats={totalStats} />
      </div>
      {desiredStatRanges.map((c) => {
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
                  displayProperties: statDef.displayProperties,
                  value,
                  breakdown: getStatsBreakdown()[statHash].breakdown,
                }}
                equippedHashes={equippedHashes}
              />
            )}
          >
            <TierlessStat
              isActive={c.maxStat > 0}
              isBoosted={boostedStats.has(statHash)}
              stat={statDef}
              value={value}
              effectiveValue={Math.min(value, c.maxStat)}
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

function TierlessStat({
  stat,
  isActive,
  isBoosted,
  value,
  effectiveValue,
}: {
  stat: DestinyStatDefinition;
  isActive: boolean;
  isBoosted: boolean;
  value: number;
  effectiveValue: number;
}) {
  let shownValue: number;
  let ignoredExcess: number | undefined;
  if (effectiveValue !== value) {
    if (effectiveValue === 0 || effectiveValue >= MAX_STAT) {
      shownValue = value;
    } else {
      shownValue = effectiveValue;
      ignoredExcess = value - effectiveValue;
    }
  } else {
    shownValue = value;
  }
  const showIgnoredExcess = ignoredExcess !== undefined;
  return (
    <span
      className={clsx(styles.statSegment, {
        [styles.nonActiveStat]: !showIgnoredExcess && !isActive,
      })}
    >
      <BungieImage className={styles.statIcon} src={stat.displayProperties.icon} />
      <span
        className={clsx(styles.tier, {
          [styles.boostedValue]: isBoosted,
        })}
      >
        {shownValue}
        {showIgnoredExcess && <span className={styles.nonActiveStat}>+{ignoredExcess}</span>}
      </span>
    </span>
  );
}

function TotalStats({ totalStats, enabledStats }: { totalStats: number; enabledStats: number }) {
  return (
    <>
      <span className={styles.tier}>{t('LoadoutBuilder.StatTotal', { total: enabledStats })}</span>
      {enabledStats !== totalStats && (
        <span className={clsx(styles.tier, styles.nonActiveStat)}>({totalStats})</span>
      )}
    </>
  );
}

export function ReferenceConstraints({
  resolvedStatConstraints,
}: {
  resolvedStatConstraints: ResolvedStatConstraint[];
}) {
  const defs = useD2Definitions()!;
  const totalStats = sumBy(resolvedStatConstraints, (c) => c.minStat);
  const enabledStats = sumBy(resolvedStatConstraints, (c) => (c.ignored ? 0 : c.minStat));

  return (
    <div className={styles.container}>
      <TotalStats enabledStats={enabledStats} totalStats={totalStats} />
      {resolvedStatConstraints.map((c) => {
        const statHash = c.statHash as ArmorStatHashes;
        const statDef = defs.Stat.get(statHash);
        const value = c.minStat;
        return (
          <span
            key={statHash}
            className={clsx(styles.statSegment, {
              [styles.nonActiveStat]: c.ignored,
            })}
          >
            <BungieImage className={styles.statIcon} src={statDef.displayProperties.icon} />
            <span className={styles.tier}>{value}</span>
          </span>
        );
      })}
    </div>
  );
}
