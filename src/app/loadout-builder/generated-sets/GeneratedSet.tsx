import React from 'react';
import { DimStore } from '../../inventory/store-types';
import { dimLoadoutService, Loadout } from '../../loadout/loadout.service';
import { ArmorSet, LockedItemType, StatTypes, LockedMap, StatTypesWithTotal } from '../types';
import GeneratedSetButtons from './GeneratedSetButtons';
import GeneratedSetItem from './GeneratedSetItem';
import { powerIndicatorIcon, AppIcon } from '../../shell/icons';
import _ from 'lodash';
import { getNumValidSets, calculateTotalTier, statTier } from './utils';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import { statHashes } from '../process';
import { t } from 'app/i18next-t';
import styles from './GeneratedSet.m.scss';

const updateEnabledStats = (
  statType: StatTypesWithTotal,
  oldEnabledStats: Set<StatTypesWithTotal>
): Set<StatTypesWithTotal> => {
  if (oldEnabledStats.delete(statType)) {
    return new Set(oldEnabledStats);
  } else {
    return new Set(oldEnabledStats.add(statType));
  }
};

interface Props {
  set: ArmorSet;
  selectedStore?: DimStore;
  lockedMap: LockedMap;
  style: React.CSSProperties;
  statOrder: StatTypes[];
  defs: D2ManifestDefinitions;
  forwardedRef?: React.Ref<HTMLDivElement>;
  enabledStats: Set<StatTypesWithTotal>;
  addLockedItem(lockedItem: LockedItemType): void;
  removeLockedItem(lockedItem: LockedItemType): void;
  onStatToggled(statType: Set<StatTypesWithTotal>): void;
}

/**
 * A single "stat mix" of builds. Each armor slot contains multiple possibilities,
 * but only the highest light set is displayed.
 */
function GeneratedSet({
  set,
  selectedStore,
  lockedMap,
  addLockedItem,
  removeLockedItem,
  style,
  statOrder,
  defs,
  enabledStats,
  forwardedRef,
  onStatToggled
}: Props) {
  // Set the loadout property to show/hide the loadout menu
  const setCreateLoadout = (loadout: Loadout) => {
    dimLoadoutService.editLoadout(loadout, { showClass: false });
  };

  const numSets = _.sumBy(set.sets, (setSlice) => getNumValidSets(setSlice.armor));
  if (!numSets) {
    console.error('No valid sets!');
    return null;
  }
  const firstValidSet = set.firstValidSet;

  const stats = _.mapValues(statHashes, (statHash) => defs.Stat.get(statHash));

  const tier = calculateTotalTier(set.stats);

  return (
    <div className={styles.build} style={style} ref={forwardedRef}>
      <div className={styles.header}>
        <div>
          <span>
            <span
              className={
                enabledStats.has('Total')
                  ? styles.statSegment
                  : `${styles.statSegment} ${styles.nonActiveStat}`
              }
              onClick={() => onStatToggled(updateEnabledStats('Total', enabledStats))}
              title={
                enabledStats.has('Total')
                  ? t('LoadoutBuilder.StatToggleIgnore')
                  : t('LoadoutBuilder.StatToggleInclude')
              }
            >
              <b>
                {t('LoadoutBuilder.TierNumber', {
                  tier
                })}
              </b>
            </span>
            {statOrder.map((stat) => (
              <Stat
                key={stat}
                isActive={enabledStats.has(stat)}
                stat={stats[stat]}
                value={set.stats[stat]}
                onStatClick={() => onStatToggled(updateEnabledStats(stat, enabledStats))}
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
        {firstValidSet.map((item, index) => (
          <GeneratedSetItem
            key={item.index}
            item={item}
            itemOptions={set.sets.flatMap((subSet) => subSet.armor[index])}
            locked={lockedMap[item.bucket.hash]}
            addLockedItem={addLockedItem}
            removeLockedItem={removeLockedItem}
            statValues={set.firstValidSetStatChoices[index]}
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
  onStatClick
}: {
  stat: DestinyStatDefinition;
  isActive: boolean;
  value: number;
  onStatClick(): void;
}) {
  return (
    <span
      className={isActive ? styles.statSegment : `${styles.statSegment} ${styles.nonActiveStat}`}
      onClick={onStatClick}
      title={`${stat.displayProperties.description} ${
        isActive ? t('LoadoutBuilder.StatToggleIgnore') : t('LoadoutBuilder.StatToggleInclude')
      }`}
    >
      <b>
        {t('LoadoutBuilder.TierNumber', {
          tier: statTier(value)
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
