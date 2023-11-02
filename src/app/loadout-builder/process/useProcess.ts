import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { getTagSelector, unlockedPlugSetItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { ModMap } from 'app/loadout/mod-assignment-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ProcessStatistics } from '../process-worker/types';
import {
  ArmorEnergyRules,
  ArmorSet,
  ItemsByBucket,
  ModStatChanges,
  ResolvedStatConstraint,
  StatRanges,
} from '../types';
import { getAutoMods } from './mappers';
import { runProcess } from './process-wrapper';

interface ProcessState {
  processing: boolean;
  resultStoreId: string;
  result: {
    sets: ArmorSet[];
    /**
     * The mods and rules used to generate the sets above. The sets
     * are guaranteed (modulo bugs in worker) to fit these mods given
     * these settings, so set rendering must use these to render sets.
     * Otherwise set rendering may render old sets with new settings/mods,
     * which will fail in ways indistinguishable from legitimate mismatches.
     */
    mods: PluggableInventoryItemDefinition[];
    armorEnergyRules: ArmorEnergyRules;
    modStatChanges: ModStatChanges;
    combos: number;
    processTime: number;
    statRangesFiltered?: StatRanges;

    // What the actual process did to remove some sets.
    processInfo: ProcessStatistics | undefined;
  } | null;
}

/**
 * Hook to process all the stat groups for LO in a web worker.
 */
export function useProcess({
  selectedStore,
  filteredItems,
  lockedModMap,
  modStatChanges,
  armorEnergyRules,
  resolvedStatConstraints,
  anyExotic,
  autoStatMods,
}: {
  selectedStore: DimStore;
  filteredItems: ItemsByBucket;
  lockedModMap: ModMap;
  modStatChanges: ModStatChanges;
  armorEnergyRules: ArmorEnergyRules;
  resolvedStatConstraints: ResolvedStatConstraint[];
  anyExotic: boolean;
  autoStatMods: boolean;
}) {
  const [{ result, processing }, setState] = useState<ProcessState>({
    processing: false,
    resultStoreId: selectedStore.id,
    result: null,
  });
  const getUserItemTag = useSelector(getTagSelector);

  const cleanupRef = useRef<(() => void) | null>();

  // Cleanup worker on unmount
  useEffect(
    () => () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    },
    [],
  );

  const autoModDefs = useAutoMods(selectedStore.id);

  useEffect(() => {
    // Stop any previous worker
    if (cleanupRef.current) {
      cleanupRef.current();
    }
    const { cleanup, resultPromise } = runProcess({
      autoModDefs,
      filteredItems,
      lockedModMap,
      modStatChanges,
      armorEnergyRules,
      resolvedStatConstraints,
      anyExotic,
      autoStatMods,
      getUserItemTag,
      stopOnFirstSet: false,
      strictUpgrades: false,
    });

    cleanupRef.current = cleanup;

    setState((state) => ({
      processing: true,
      resultStoreId: selectedStore.id,
      result: selectedStore.id === state.resultStoreId ? state.result : null,
    }));

    resultPromise
      .then(({ sets, combos, statRangesFiltered, processInfo, processTime }) => {
        setState((oldState) => ({
          ...oldState,
          processing: false,
          result: {
            sets,
            mods: lockedModMap.allMods,
            armorEnergyRules,
            modStatChanges,
            combos,
            processTime,
            statRangesFiltered,
            processInfo,
          },
        }));
      })
      // Cleanup the worker, we don't need it anymore.
      .finally(() => {
        cleanup();
        cleanupRef.current = null;
      });
  }, [
    filteredItems,
    selectedStore.id,
    resolvedStatConstraints,
    anyExotic,
    armorEnergyRules,
    autoStatMods,
    lockedModMap,
    getUserItemTag,
    modStatChanges,
    autoModDefs,
  ]);

  return { result, processing };
}

/**
 * Compute information about the mods LO could automatically assign.
 */
export function useAutoMods(storeId: string) {
  const defs = useD2Definitions()!;
  const unlockedPlugs = useSelector(unlockedPlugSetItemsSelector(storeId));
  return useMemo(() => getAutoMods(defs, unlockedPlugs), [defs, unlockedPlugs]);
}
