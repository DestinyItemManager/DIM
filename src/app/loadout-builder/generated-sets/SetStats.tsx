import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, powerIndicatorIcon } from 'app/shell/icons';
import StatTooltip from 'app/store-stats/StatTooltip';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { ArmorStatHashes, ArmorStats, StatFilters } from '../types';
import { remEuclid, statTier, statTierWithHalf } from '../utils';
import styles from './SetStats.m.scss';

interface Props {
  stats: ArmorStats;
  tier: number;
  enabledTier: number;
  artificeStats: ArmorStats;
  maxPower: number;
  statOrder: ArmorStatHashes[];
  statFilters: StatFilters;
  className?: string;
  existingLoadoutName?: string;
}

/**
 * Displays the overall tier and per-stat tier of a set.
 */
function SetStats({
  stats,
  tier,
  enabledTier,
  artificeStats,
  maxPower,
  statOrder,
  statFilters,
  className,
  existingLoadoutName,
}: Props) {
  const defs = useD2Definitions()!;
  const statDefs: { [statHash: number]: DestinyStatDefinition } = {};
  for (const statHash of statOrder) {
    statDefs[statHash] = defs.Stat.get(statHash);
  }

  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.tierLightContainer}>
        <span className={clsx(styles.tier, styles.tierLightSegment)}>
          {t('LoadoutBuilder.TierNumber', {
            tier: enabledTier,
          })}
        </span>
        {enabledTier !== tier && (
          <span className={clsx(styles.tier, styles.nonActiveStat)}>
            {` (${t('LoadoutBuilder.TierNumber', {
              tier: tier,
            })})`}
          </span>
        )}
        <span className={styles.light}>
          <AppIcon icon={powerIndicatorIcon} className={clsx(styles.statIcon)} /> {maxPower}
        </span>
        <span>
          {/* FIXME remove this when artifice mods have defs */}
          Artifice:{' '}
          {Object.entries(artificeStats).map(
            ([statHash, val]) => val > 0 && `${statDefs[statHash].displayProperties.name}: ${val}, `
          )}
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
              ignored={statFilters[statHash].ignored}
              stat={statDefs[statHash]}
              value={stats[statHash]}
              maxTier={statFilters[statHash].max}
            />
          </PressTip>
        ))}
      </div>
    </div>
  );
}

function Stat({
  stat,
  ignored,
  value,
  maxTier,
}: {
  stat: DestinyStatDefinition;
  ignored: boolean;
  value: number;
  maxTier: number;
}) {
  const effectiveTier = statTier(value, maxTier);
  const totalTier = statTier(value, 10);
  return (
    <span
      className={clsx(styles.statSegment, {
        [styles.nonActiveStat]: ignored || effectiveTier !== totalTier,
      })}
    >
      <span
        className={clsx(styles.tier, {
          [styles.halfTierValue]: !ignored && totalTier < maxTier && remEuclid(value, 10) >= 5,
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
