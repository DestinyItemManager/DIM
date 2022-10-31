import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { isPluggableItem } from 'app/inventory/store/sockets';
import PlugDef from 'app/loadout/loadout-ui/PlugDef';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, powerIndicatorIcon } from 'app/shell/icons';
import StatTooltip from 'app/store-stats/StatTooltip';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { ArmorSet, ArmorStatHashes, StatFilters } from '../types';
import { remEuclid, statTierWithHalf } from '../utils';
import styles from './SetStats.m.scss';

interface Props {
  armorSet: ArmorSet;
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
  armorSet,
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
            tier: armorSet.enabledTier,
          })}
        </span>
        {armorSet.enabledTier !== armorSet.totalTier && (
          <span className={clsx(styles.tier, styles.nonActiveStat)}>
            {` (${t('LoadoutBuilder.TierNumber', {
              tier: armorSet.totalTier,
            })})`}
          </span>
        )}
        {armorSet.statMods.length > 0 && (
          <div className={clsx(styles.autoModsContainer)}>
            {armorSet.statMods.map((modHash, idx) => {
              const def = defs.InventoryItem.get(modHash);
              return (
                isPluggableItem(def) && <PlugDef className={clsx('item')} key={idx} plug={def} />
              );
            })}
          </div>
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
                  value: armorSet.totalStats[statHash],
                  description: statDefs[statHash].displayProperties.description,
                }}
              />
            )}
          >
            <Stat
              isActive={statFilters[statHash].priority !== 'ignored'}
              stat={statDefs[statHash]}
              value={armorSet.totalStats[statHash]}
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
