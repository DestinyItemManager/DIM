import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { fitMostMods } from 'app/loadout/mod-assignment-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { errorLog } from 'app/utils/log';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React, { Dispatch, useMemo } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ArmorEnergyRules, ArmorSet, ArmorStatHashes, PinnedItems } from '../types';
import { getPower } from '../utils';
import styles from './GeneratedSet.m.scss';
import GeneratedSetButtons from './GeneratedSetButtons';
import GeneratedSetItem from './GeneratedSetItem';
import SetStats from './SetStats';

interface Props {
  set: ArmorSet;
  subclass: ResolvedLoadoutItem | undefined;
  notes?: string;
  selectedStore: DimStore;
  lockedMods: PluggableInventoryItemDefinition[];
  pinnedItems: PinnedItems;
  style: React.CSSProperties;
  statOrder: ArmorStatHashes[];
  forwardedRef?: React.Ref<HTMLDivElement>;
  enabledStats: Set<number>;
  loadouts: Loadout[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  params: LoadoutParameters;
  halfTierMods: PluggableInventoryItemDefinition[];
  armorEnergyRules: ArmorEnergyRules;
}

/**
 * A single "stat mix" of builds. Each armor slot contains multiple possibilities,
 * but only the highest light set is displayed.
 */
function GeneratedSet({
  set,
  subclass,
  notes,
  selectedStore,
  lockedMods,
  pinnedItems,
  style,
  statOrder,
  enabledStats,
  forwardedRef,
  loadouts,
  lbDispatch,
  params,
  halfTierMods,
  armorEnergyRules,
}: Props) {
  const defs = useD2Definitions()!;

  // Set the loadout property to show/hide the loadout menu
  const setCreateLoadout = (loadout: Loadout) => {
    editLoadout(loadout, selectedStore.id, {
      showClass: false,
    });
  };

  let existingLoadout: Loadout | undefined;
  // Items are sorted by their energy capacity when grouping
  let displayedItems: DimItem[] = set.armor.map((items) => items[0]);

  for (const loadout of loadouts) {
    const equippedLoadoutItems = loadout.items.filter((item) => item.equip);
    const allSetItems = set.armor.flat();
    // Accessing id is safe: Armor is always instanced
    const intersection = _.intersectionBy(allSetItems, equippedLoadoutItems, (item) => item.id);
    if (intersection.length === set.armor.length) {
      existingLoadout = loadout;
      displayedItems = intersection;
      break;
    }
  }

  let itemModAssignments = useMemo(() => {
    const statMods = set.statMods.map(
      (d) => defs.InventoryItem.get(d) as PluggableInventoryItemDefinition
    );
    const allMods = [...lockedMods, ...statMods];
    const { itemModAssignments, unassignedMods } = fitMostMods({
      items: displayedItems,
      plannedMods: allMods,
      armorEnergyRules,
    });

    // Set rendering is a great place to verify that the worker process
    // and DIM's regular mod assignment algorithm agree with each other,
    // so do that here.
    if (unassignedMods.length) {
      errorLog(
        'loadout optimizer',
        'internal error: set rendering was unable to fit some mods that the worker thought were possible',
        unassignedMods
      );
    }

    return itemModAssignments;
  }, [set.statMods, lockedMods, displayedItems, armorEnergyRules, defs.InventoryItem]);

  if (!existingLoadout) {
    itemModAssignments = { ...itemModAssignments };
    // If we have a bucket with alternatives, pick an alternative
    // item of the correct element. This is mostly for class items,
    // and works because fitMostMods prefers changing class item
    // elements over other pieces
    for (let i = 0; i < set.armor.length; i++) {
      if (set.armor[i].length > 1) {
        const targetEnergy = itemModAssignments[displayedItems[i].id]
          .map((m) => m.plug.energyCost?.energyType)
          .find((e) => e !== DestinyEnergyType.Any);
        if (targetEnergy !== undefined && targetEnergy !== displayedItems[i].energy?.energyType) {
          const replacementItem = set.armor[i].find((i) => i.energy?.energyType === targetEnergy);
          if (replacementItem) {
            const mods = itemModAssignments[displayedItems[i].id];
            delete itemModAssignments[displayedItems[i].id];
            itemModAssignments[replacementItem.id] = mods;
            displayedItems[i] = replacementItem;
          }
        }
      }
    }
  }

  const canCompareLoadouts =
    set.armor.every((items) => items[0].classType === selectedStore.classType) &&
    loadouts.some((l) => l.classType === selectedStore.classType);

  return (
    <div className={styles.container} style={style} ref={forwardedRef}>
      <div className={styles.build}>
        <div className={styles.header}>
          <SetStats
            stats={set.stats}
            autoStatMods={set.statMods}
            maxPower={getPower(displayedItems)}
            statOrder={statOrder}
            enabledStats={enabledStats}
            existingLoadoutName={existingLoadout?.name}
          />
        </div>
        <div className={styles.items}>
          {displayedItems.map((item, i) => (
            <GeneratedSetItem
              key={item.index}
              item={item}
              itemOptions={set.armor[i]}
              pinned={pinnedItems[item.bucket.hash] === item}
              lbDispatch={lbDispatch}
              assignedMods={itemModAssignments[item.id]}
              showEnergyChanges={Boolean(lockedMods.length || set.statMods.length)}
            />
          ))}
        </div>
      </div>
      <GeneratedSetButtons
        set={set}
        items={displayedItems}
        subclass={subclass}
        store={selectedStore}
        canCompareLoadouts={canCompareLoadouts}
        halfTierMods={halfTierMods}
        onLoadoutSet={setCreateLoadout}
        lbDispatch={lbDispatch}
        notes={notes}
        params={params}
      />
    </div>
  );
}

const ForwardedGeneratedSet = React.forwardRef<HTMLDivElement, Props>((props, ref) => (
  <GeneratedSet forwardedRef={ref} {...props} />
));

export default React.memo(ForwardedGeneratedSet);
