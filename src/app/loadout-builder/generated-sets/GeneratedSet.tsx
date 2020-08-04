import React, { Dispatch } from 'react';
import { DimStore } from '../../inventory/store-types';
import { ArmorSet, StatTypes, LockedMap, LockedArmor2ModMap } from '../types';
import GeneratedSetButtons from './GeneratedSetButtons';
import GeneratedSetItem from './GeneratedSetItem';
import _ from 'lodash';
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

  if (set.armor.some((items) => !items.length)) {
    console.error('No valid sets!');
    return null;
  }

  const assignedMods = $featureFlags.armor2ModPicker
    ? assignModsToArmorSet(
        set.armor.map((items) => items[0]),
        lockedArmor2Mods
      )
    : {};

  return (
    <div className={styles.build} style={style} ref={forwardedRef}>
      <div className={styles.header}>
        <SetStats defs={defs} set={set} statOrder={statOrder} enabledStats={enabledStats} />
        <GeneratedSetButtons set={set} store={selectedStore!} onLoadoutSet={setCreateLoadout} />
      </div>
      <div className={styles.items}>
        {set.armor.map((items, index) => (
          <GeneratedSetItem
            key={items[0].index}
            item={items[0]}
            defs={defs}
            itemOptions={items}
            locked={lockedMap[items[0].bucket.hash]}
            lbDispatch={lbDispatch}
            statValues={set.statChoices[index]}
            lockedMods={assignedMods[items[0].id]}
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
