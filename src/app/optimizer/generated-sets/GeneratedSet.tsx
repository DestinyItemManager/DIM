import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { Loadout } from 'app/loadout/loadout-types';
import { editLoadout } from 'app/loadout/LoadoutDrawer';
import { errorLog } from 'app/utils/log';
import React, { Dispatch } from 'react';
import { DimStore } from '../../inventory/store-types';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { assignModsToArmorSet } from '../mod-utils';
import { ArmorSet, LockedMap, LockedMods, StatTypes } from '../types';
import { getPower } from '../utils';
import styles from './GeneratedSet.m.scss';
import GeneratedSetButtons from './GeneratedSetButtons';
import GeneratedSetItem from './GeneratedSetItem';
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
  lockedMods: LockedMods;
  loadouts: Loadout[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  params: LoadoutParameters;
  halfTierMods: PluggableInventoryItemDefinition[];
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
  lockedMods,
  loadouts,
  lbDispatch,
  params,
  halfTierMods,
}: Props) {
  // Set the loadout property to show/hide the loadout menu
  const setCreateLoadout = (loadout: Loadout) => {
    loadout.parameters = params;
    editLoadout(loadout, {
      showClass: false,
    });
  };

  if (set.armor.some((items) => !items.length)) {
    errorLog('loadout optimizer', 'No valid sets!');
    return null;
  }

  const [assignedMods] = assignModsToArmorSet(
    set.armor.map((items) => items[0]),
    lockedMods
  );

  const canCompareLoadouts =
    set.armor.every((items) => items[0].classType === selectedStore?.classType) &&
    loadouts.some((l) => l.classType === selectedStore?.classType);

  const existingLoadout = loadouts.find((loadout) =>
    set.armor.every((items) => loadout.items.map((item) => item.id).includes(items[0].id))
  );

  const items = set.armor.map((items) => items[0]);

  return (
    <div className={styles.container} style={style} ref={forwardedRef}>
      <div className={styles.build}>
        <div className={styles.header}>
          <SetStats
            defs={defs}
            stats={set.stats}
            items={items}
            maxPower={getPower(items)}
            statOrder={statOrder}
            enabledStats={enabledStats}
            existingLoadoutName={existingLoadout?.name}
            characterClass={selectedStore?.classType}
          />
        </div>
        <div className={styles.items}>
          {set.armor.map((items) => (
            <GeneratedSetItem
              key={items[0].index}
              item={items[0]}
              defs={defs}
              itemOptions={items}
              locked={lockedMap[items[0].bucket.hash]}
              lbDispatch={lbDispatch}
              lockedMods={assignedMods[items[0].id]}
            />
          ))}
        </div>
      </div>
      <GeneratedSetButtons
        set={set}
        store={selectedStore!}
        canCompareLoadouts={canCompareLoadouts}
        halfTierMods={halfTierMods}
        onLoadoutSet={setCreateLoadout}
        lbDispatch={lbDispatch}
      />
    </div>
  );
}

export default React.memo(
  React.forwardRef<HTMLDivElement, Props>((props, ref) => (
    <GeneratedSet forwardedRef={ref} {...props} />
  ))
);
