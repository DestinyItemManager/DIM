import React, { Dispatch } from 'react';
import { DimStore } from '../../inventory/store-types';
import { ArmorSet, StatTypes, LockedMap, LockedArmor2ModMap } from '../types';
import GeneratedSetButtons from './GeneratedSetButtons';
import GeneratedSetItem from './GeneratedSetItem';
import _ from 'lodash';
import { getNumValidSets } from './utils';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import styles from './GeneratedSet.m.scss';
import { editLoadout } from 'app/loadout/LoadoutDrawer';
import { Loadout } from 'app/loadout/loadout-types';
import { assignModsToArmorSet } from '../mod-utils';
import { LoadoutBuilderAction } from '../loadoutBuilderReducer';
import SetStats from './SetStats';

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

  const assignedMods = $featureFlags.armor2ModPicker
    ? assignModsToArmorSet(set.firstValidSet, lockedArmor2Mods)
    : {};

  return (
    <div className={styles.build} style={style} ref={forwardedRef}>
      <div className={styles.header}>
        <SetStats
          defs={defs}
          set={set}
          statOrder={statOrder}
          enabledStats={enabledStats}
          lockedArmor2Mods={lockedArmor2Mods}
        />
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
            statOrder={statOrder}
          />
        ))}
      </div>
    </div>
  );
}

export default React.memo(
  React.forwardRef<HTMLDivElement, Props>((props, ref) => (
    <GeneratedSet forwardedRef={ref} {...props} />
  ))
);
