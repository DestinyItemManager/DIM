import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { Dispatch, memo, useLayoutEffect, useRef } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ArmorEnergyRules, ArmorSet, ModStatChanges, PinnedItems } from '../types';
import GeneratedSet, { containerClass } from './GeneratedSet';

/**
 * Renders the entire list of generated stat mixes, one per mix.
 */
export default memo(function GeneratedSets({
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
  // Dynamic-height window-based virtual list code based on https://tanstack.com/virtual/v3/docs/examples/react/dynamic
  const parentRef = useRef<HTMLDivElement>(null);
  const parentOffsetRef = useRef(0);
  useLayoutEffect(() => {
    parentOffsetRef.current = parentRef.current?.offsetTop ?? 0;
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: sets.length,
    estimateSize: () => 40,
    scrollMargin: parentOffsetRef.current,
  });

  if (sets.length === 0) {
    return null;
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${items[0].start - virtualizer.options.scrollMargin}px)`,
        }}
      >
        {items.map((virtualItem) => (
          <div
            key={virtualItem.key}
            ref={virtualizer.measureElement}
            className={containerClass}
            data-index={virtualItem.index}
          >
            <GeneratedSet
              index={virtualItem.index}
              set={sets[virtualItem.index]}
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
          </div>
        ))}
      </div>
    </div>
  );
});
