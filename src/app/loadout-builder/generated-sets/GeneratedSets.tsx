import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { Dispatch, memo, useEffect, useRef } from 'react';
import {
  CellMeasurer,
  CellMeasurerCache,
  List,
  ListRowRenderer,
  WindowScroller,
} from 'react-virtualized';
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
  const windowScroller = useRef<WindowScroller>(null);

  const cache = useRef(
    new CellMeasurerCache({
      defaultHeight: 150,
      fixedWidth: true,
    })
  );

  useEffect(() => {
    windowScroller.current?.updatePosition();
  });

  const rowRenderer: ListRowRenderer = ({ index, key, parent, style }) => (
    <CellMeasurer cache={cache.current} columnIndex={0} key={key} parent={parent} rowIndex={index}>
      {({ registerChild }) => (
        <div
          className={containerClass}
          style={style}
          ref={registerChild as unknown as React.Ref<HTMLDivElement>}
        >
          <GeneratedSet
            index={index}
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
        </div>
      )}
    </CellMeasurer>
  );

  if (sets.length === 0) {
    return null;
  }

  return (
    <WindowScroller ref={windowScroller}>
      {({ height, isScrolling, onChildScroll, scrollTop }) => (
        <List
          deferredMeasurementCache={cache.current}
          autoHeight={true}
          height={height}
          width={1500}
          isScrolling={isScrolling}
          onScroll={onChildScroll}
          overscanRowCount={2}
          rowCount={sets.length}
          rowHeight={cache.current.rowHeight}
          rowRenderer={rowRenderer}
          scrollTop={scrollTop}
        />
      )}
    </WindowScroller>
  );
});
