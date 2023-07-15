import { StatConstraint } from '@destinyitemmanager/dim-api-types';
import { WindowVirtualList } from 'app/dim-ui/VirtualList';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { emptyArray } from 'app/utils/empty';
import _ from 'lodash';
import { Dispatch, useMemo } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { useAutoMods } from '../process/useProcess';
import {
  ArmorEnergyRules,
  ArmorSet,
  ArmorStatHashes,
  ModStatChanges,
  PinnedItems,
  ResolvedStatConstraint,
} from '../types';
import GeneratedSet, { containerClass } from './GeneratedSet';

function getItemKey(index: number) {
  return index;
}

/**
 * Renders the entire list of generated stat mixes, one per mix.
 */
export default function GeneratedSets({
  lockedMods,
  pinnedItems,
  selectedStore,
  sets,
  subclass,
  resolvedStatConstraints,
  modStatChanges,
  loadouts,
  lbDispatch,
  armorEnergyRules,
  loadout,
  existingLoadout,
}: {
  selectedStore: DimStore;
  sets: readonly ArmorSet[];
  subclass: ResolvedLoadoutItem | undefined;
  lockedMods: PluggableInventoryItemDefinition[];
  pinnedItems: PinnedItems;
  resolvedStatConstraints: ResolvedStatConstraint[];
  modStatChanges: ModStatChanges;
  loadouts: Loadout[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  armorEnergyRules: ArmorEnergyRules;
  loadout: Loadout;
  existingLoadout: boolean;
}) {
  const params = loadout.parameters!;
  const halfTierMods = useHalfTierMods(
    selectedStore.id,
    Boolean(params.autoStatMods),
    params.statConstraints!
  );

  const equippedHashes = useMemo(() => {
    const exoticArmorHash = params.exoticArmorHash;
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
    return equippedHashes;
  }, [params.exoticArmorHash, subclass?.loadoutItem.socketOverrides]);

  return (
    <WindowVirtualList
      numElements={sets.length}
      estimatedSize={160}
      itemContainerClassName={containerClass}
      getItemKey={getItemKey}
    >
      {(index) => (
        <GeneratedSet
          set={sets[index]}
          selectedStore={selectedStore}
          lockedMods={lockedMods}
          pinnedItems={pinnedItems}
          lbDispatch={lbDispatch}
          resolvedStatConstraints={resolvedStatConstraints}
          modStatChanges={modStatChanges}
          loadouts={loadouts}
          halfTierMods={halfTierMods}
          armorEnergyRules={armorEnergyRules}
          originalLoadout={loadout}
          equippedHashes={equippedHashes}
          existingLoadout={existingLoadout}
        />
      )}
    </WindowVirtualList>
  );
}

/**
 * Half tier (+5) mods in user stat order so that the quick-add button
 * automatically adds them, but only for stats we care about (and only if we're
 * not adding stat mods automatically ourselves).
 */
// TODO: selectorize this so it can be moved into the buttons component?
function useHalfTierMods(
  selectedStoreId: string,
  autoStatMods: boolean,
  statConstraints: StatConstraint[]
): PluggableInventoryItemDefinition[] {
  // Info about stat mods
  const autoMods = useAutoMods(selectedStoreId);
  return useMemo(
    () =>
      // If we are automatically assigning stat mods, don't even offer half tier quick-add
      autoStatMods
        ? emptyArray()
        : _.compact(
            statConstraints.map(
              (s) => autoMods.generalMods[s.statHash as ArmorStatHashes]?.minorMod
            )
          ),
    [autoMods.generalMods, statConstraints, autoStatMods]
  );
}
