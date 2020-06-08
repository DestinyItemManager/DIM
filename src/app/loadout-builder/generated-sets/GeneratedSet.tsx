import React, { Dispatch } from 'react';
import { DimStore } from '../../inventory/store-types';
import { ArmorSet, StatTypes, LockedMap, LockedArmor2ModMap } from '../types';
import GeneratedSetButtons from './GeneratedSetButtons';
import GeneratedSetItem from './GeneratedSetItem';
import { powerIndicatorIcon, AppIcon } from '../../shell/icons';
import _ from 'lodash';
import { getNumValidSets, calculateTotalTier, statTier, sumEnabledStats } from './utils';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import { statHashes } from '../process';
import { t } from 'app/i18next-t';
import styles from './GeneratedSet.m.scss';
import { editLoadout } from 'app/loadout/LoadoutDrawer';
import { Loadout } from 'app/loadout/loadout-types';
import { assignModsToArmorSet } from './mod-utils';
import { Armor2ModPlugCategories } from 'app/utils/item-utils';
import { LoadoutBuilderAction } from '../LoadoutBuilder';

interface Props {
  set: ArmorSet;
  selectedStore?: DimStore;
  lockedMap: LockedMap;
  style: React.CSSProperties;
  statOrder: StatTypes[];
  defs: D2ManifestDefinitions;
  forwardedRef?: React.Ref<HTMLDivElement>;
  enabledStats: Set<StatTypes>;
  lockedArmor2Mods: LockedArmor2ModMap;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}

/**
 * A single "stat mix" of builds. Each armor slot contains multiple possibilities,
 * but only the highest light set is displayed.
 */
function GeneratedSet({
  set,
  selectedStore,
  lockedMap,
  style,
  statOrder,
  defs,
  enabledStats,
  forwardedRef,
  lockedArmor2Mods,
  lbDispatch,
}: Props) {
  // Set the loadout property to show/hide the loadout menu
  const setCreateLoadout = (loadout: Loadout) => {
    editLoadout(loadout, { showClass: false });
  };

  const numSets = _.sumBy(set.sets, (setSlice) => getNumValidSets(setSlice.armor));
  if (!numSets) {
    console.error('No valid sets!');
    return null;
  }

  const stats = _.mapValues(statHashes, (statHash) => defs.Stat.get(statHash));

  const totalTier = calculateTotalTier(set.stats);
  const enabledTier = sumEnabledStats(set.stats, enabledStats);

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

  const assignedMods = $featureFlags.armor2ModPicker
    ? assignModsToArmorSet(set.firstValidSet, lockedArmor2Mods)
    : {};

  return (
    <div className={styles.build} style={style} ref={forwardedRef}>
      <div className={styles.header}>
        <div>
          <span>
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

        <GeneratedSetButtons
          numSets={numSets}
          set={set}
          store={selectedStore!}
          onLoadoutSet={setCreateLoadout}
        />
      </div>
      <div className={styles.items}>
        {set.firstValidSet.map((item, index) => (
          <GeneratedSetItem
            key={item.index}
            item={item}
            defs={defs}
            itemOptions={set.sets.flatMap((subSet) => subSet.armor[index])}
            locked={lockedMap[item.bucket.hash]}
            lbDispatch={lbDispatch}
            statValues={set.firstValidSetStatChoices[index]}
            lockedMods={assignedMods[item.hash]}
          />
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

export default React.memo(
  React.forwardRef<HTMLDivElement, Props>((props, ref) => (
    <GeneratedSet forwardedRef={ref} {...props} />
  ))
);
