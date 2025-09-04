import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import { WindowVirtualList } from 'app/dim-ui/VirtualList';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { Loadout } from 'app/loadout/loadout-types';
import { identity } from 'app/utils/functions';
import { Dispatch } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import {
  ArmorEnergyRules,
  ArmorSet,
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
  return (
    <WindowVirtualList
      numElements={sets.length}
      estimatedSize={160}
      itemContainerClassName={containerClass}
      getItemKey={identity}
    >
      {(index) => (
        <ErrorBoundary key={index} name="GeneratedSet">
          <GeneratedSet
            set={sets[index]}
            selectedStore={selectedStore}
            lockedMods={lockedMods}
            pinnedItems={pinnedItems}
            lbDispatch={lbDispatch}
            desiredStatRanges={desiredStatRanges}
            modStatChanges={modStatChanges}
            loadouts={loadouts}
            armorEnergyRules={armorEnergyRules}
            originalLoadout={loadout}
            equippedHashes={equippedHashes}
            autoStatMods={autoStatMods}
          />
        </ErrorBoundary>
      )}
    </WindowVirtualList>
  );
}
