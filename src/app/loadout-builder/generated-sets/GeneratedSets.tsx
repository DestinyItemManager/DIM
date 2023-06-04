import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import WindowVirtualList from 'app/dim-ui/WindowVirtualList';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { Dispatch } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ArmorEnergyRules, ArmorSet, ModStatChanges, PinnedItems } from '../types';
import GeneratedSet, { containerClass } from './GeneratedSet';

/**
 * Renders the entire list of generated stat mixes, one per mix.
 */
export default function GeneratedSets({
  lockedMods,
  pinnedItems,
  selectedStore,
  sets,
  subclass,
  statOrder,
  enabledStats,
  modStatChanges,
  loadouts,
  lbDispatch,
  params,
  halfTierMods,
  armorEnergyRules,
  notes,
}: {
  selectedStore: DimStore;
  sets: readonly ArmorSet[];
  subclass: ResolvedLoadoutItem | undefined;
  lockedMods: PluggableInventoryItemDefinition[];
  pinnedItems: PinnedItems;
  statOrder: number[];
  enabledStats: Set<number>;
  modStatChanges: ModStatChanges;
  loadouts: Loadout[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  params: LoadoutParameters;
  halfTierMods: PluggableInventoryItemDefinition[];
  armorEnergyRules: ArmorEnergyRules;
  notes?: string;
}) {
  return (
    <WindowVirtualList
      numElements={sets.length}
      estimatedSize={160}
      itemContainerClassName={containerClass}
      getItemKey={(index) => index}
    >
      {(index) => (
        <GeneratedSet
          set={sets[index]}
          subclass={subclass}
          selectedStore={selectedStore}
          lockedMods={lockedMods}
          pinnedItems={pinnedItems}
          lbDispatch={lbDispatch}
          statOrder={statOrder}
          enabledStats={enabledStats}
          modStatChanges={modStatChanges}
          loadouts={loadouts}
          params={params}
          halfTierMods={halfTierMods}
          armorEnergyRules={armorEnergyRules}
          notes={notes}
        />
      )}
    </WindowVirtualList>
  );
}
