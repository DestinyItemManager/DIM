import { StatConstraint } from '@destinyitemmanager/dim-api-types';
import { WindowVirtualList } from 'app/dim-ui/VirtualList';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { Loadout } from 'app/loadout/loadout-types';
import { filterMap } from 'app/utils/collections';
import { emptyArray } from 'app/utils/empty';
import { identity } from 'app/utils/functions';
import { Dispatch, useMemo } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { useAutoMods } from '../process/useProcess';
import {
  ArmorEnergyRules,
  ArmorSet,
  ArmorStatHashes,
  DesiredStatRange,
  ModStatChanges,
  PinnedItems,
} from '../types';
import GeneratedSet, { containerClass } from './GeneratedSet';

/**
 * Renders the entire list of generated stat mixes, one per mix.
 */
export default function GeneratedSets({
  lockedMods,
  pinnedItems,
  selectedStore,
  sets,
  equippedHashes,
  desiredStatRanges,
  modStatChanges,
  loadouts,
  lbDispatch,
  armorEnergyRules,
  loadout,
  autoStatMods,
}: {
  selectedStore: DimStore;
  sets: readonly ArmorSet[];
  equippedHashes: Set<number>;
  lockedMods: PluggableInventoryItemDefinition[];
  pinnedItems: PinnedItems;
  desiredStatRanges: DesiredStatRange[];
  modStatChanges: ModStatChanges;
  loadouts: Loadout[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  armorEnergyRules: ArmorEnergyRules;
  loadout: Loadout;
  autoStatMods: boolean;
}) {
  const params = loadout.parameters!;
  const halfTierMods = useHalfTierMods(
    selectedStore.id,
    Boolean(params.autoStatMods),
    params.statConstraints!,
  );

  return (
    <WindowVirtualList
      numElements={sets.length}
      estimatedSize={160}
      itemContainerClassName={containerClass}
      getItemKey={identity}
    >
      {(index) => (
        <GeneratedSet
          set={sets[index]}
          selectedStore={selectedStore}
          lockedMods={lockedMods}
          pinnedItems={pinnedItems}
          lbDispatch={lbDispatch}
          desiredStatRanges={desiredStatRanges}
          modStatChanges={modStatChanges}
          loadouts={loadouts}
          halfTierMods={halfTierMods}
          armorEnergyRules={armorEnergyRules}
          originalLoadout={loadout}
          equippedHashes={equippedHashes}
          autoStatMods={autoStatMods}
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
  statConstraints: StatConstraint[],
): PluggableInventoryItemDefinition[] {
  // Info about stat mods
  const autoMods = useAutoMods(selectedStoreId);
  return useMemo(
    () =>
      // If we are automatically assigning stat mods, don't even offer half tier quick-add
      autoStatMods
        ? emptyArray()
        : filterMap(
            statConstraints,
            (s) => autoMods.generalMods[s.statHash as ArmorStatHashes]?.minorMod,
          ),
    [autoMods.generalMods, statConstraints, autoStatMods],
  );
}
