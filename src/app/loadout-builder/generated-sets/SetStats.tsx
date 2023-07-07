import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, powerIndicatorIcon } from 'app/shell/icons';
import StatTooltip from 'app/store-stats/StatTooltip';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { ArmorStatHashes, ArmorStats, ModStatChanges } from '../types';
import { remEuclid, statTierWithHalf } from '../utils';
import styles from './SetStats.m.scss';
import { calculateTotalTier, sumEnabledStats } from './utils';

/**
 * Displays the overall tier and per-stat tier of a generated loadout set.
 */
// TODO: would be a lot easier if this was just passed a Loadout or FullyResolvedLoadout...
function SetStats({
  stats,
  getStatsBreakdown,
  maxPower,
  statOrder,
  enabledStats,
  boostedStats,
  className,
  existingLoadoutName,
  subclass,
  exoticArmorHash,
}: {
  stats: ArmorStats;
  getStatsBreakdown: () => ModStatChanges;
  maxPower: number;
  statOrder: ArmorStatHashes[];
  enabledStats: Set<ArmorStatHashes>;
  boostedStats: Set<ArmorStatHashes>;
  className?: string;
  existingLoadoutName?: string;
  subclass?: ResolvedLoadoutItem;
  exoticArmorHash?: number;
}) {
  const defs = useD2Definitions()!;
  const statDefs: { [statHash: number]: DestinyStatDefinition } = {};
  for (const statHash of statOrder) {
    statDefs[statHash] = defs.Stat.get(statHash);
  }
  const totalTier = calculateTotalTier(stats);
  const enabledTier = sumEnabledStats(stats, enabledStats);

  // Fill in info about selected items / subclass options for Clarity character stats
  const equippedHashes = new Set<number>();
  if (exoticArmorHash) {
    equippedHashes.add(exoticArmorHash);
  }
  if (subclass?.loadoutItem.socketOverrides) {
    for (const hash of Object.values(subclass.loadoutItem.socketOverrides)) {
      equippedHashes.add(hash);
    }
  }

  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.tierLightContainer}>
        <span className={clsx(styles.tier)}>
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
      </div>
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
                breakdown: getStatsBreakdown()[statHash].breakdown,
              }}
              equippedHashes={equippedHashes}
            />
          )}
        >
          <Stat
            isActive={enabledStats.has(statHash)}
            isBoosted={boostedStats.has(statHash)}
            stat={statDefs[statHash]}
            value={stats[statHash]}
          />
        </PressTip>
      ))}
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
}: {
  stat: DestinyStatDefinition;
  isActive: boolean;
  isBoosted: boolean;
  value: number;
}) {
  const isHalfTier = isActive && remEuclid(value, 10) >= 5;
  return (
    <span
      className={clsx(styles.statSegment, {
        [styles.nonActiveStat]: !isActive,
      })}
    >
      <BungieImage className={clsx(styles.statIcon)} src={stat.displayProperties.icon} />
      <span
        className={clsx(styles.tier, {
          [styles.halfTierValue]: isHalfTier,
          [styles.boostedValue]: !isHalfTier && isBoosted,
        })}
      >
        {t('LoadoutBuilder.TierNumber', {
          tier: statTierWithHalf(value),
        })}
      </span>
    </span>
  );
}

export default SetStats;
