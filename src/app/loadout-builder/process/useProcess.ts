import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { getTagSelector, unlockedPlugSetItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { ModMap } from 'app/loadout/mod-assignment-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { infoLog } from 'app/utils/log';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { ProcessInputs } from '../process-worker/process';
import { ProcessStatistics } from '../process-worker/types';
import {
  ArmorEnergyRules,
  ArmorSet,
  DesiredStatRange,
  ItemsByBucket,
  ModStatChanges,
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
  desiredStatRanges,
  anyExotic,
  autoStatMods,
  strictUpgrades,
}: {
  selectedStore: DimStore;
  filteredItems: ItemsByBucket;
  lockedModMap: ModMap;
  modStatChanges: ModStatChanges;
  armorEnergyRules: ArmorEnergyRules;
  desiredStatRanges: DesiredStatRange[];
  anyExotic: boolean;
  autoStatMods: boolean;
  strictUpgrades: boolean;
}) {
  const [{ result, processing }, setState] = useState<ProcessState>({
    processing: false,
    resultStoreId: selectedStore.id,
    result: null,
  });
  const getUserItemTag = useSelector(getTagSelector);
  const autoModDefs = useAutoMods(selectedStore.id);
  const firstTime = result === null;

  // Normally we'd just use the cleanup function in the main useEffect, but we
  // want to be able to short circuit updates without killing in-progress
  // processes.
  const cleanupRef = useRef<() => void>(undefined);
  useEffect(
    () => () => {
      // Cleanup the previous process if it exists
      cleanupRef.current?.();
      cleanupRef.current = undefined;
    },
    [],
  );
  // This allows for some memoization of the inputs to the worker
  const inputsRef = useRef<ProcessInputs>(undefined);

  useEffect(() => {
    const doProcess = async () => {
      const processInfo = runProcess({
        autoModDefs,
        filteredItems,
        lockedModMap,
        modStatChanges,
        armorEnergyRules,
        desiredStatRanges,
        anyExotic,
        autoStatMods,
        getUserItemTag,
        stopOnFirstSet: false,
        strictUpgrades,
        lastInput: inputsRef.current,
      });
      if (processInfo === undefined) {
        infoLog('loadout optimizer', 'Inputs were equal to the previous run, not recalculating');
        return;
      }

      const { cleanup, resultPromise, input } = processInfo;
      cleanupRef.current?.();
      cleanupRef.current = cleanup;
      inputsRef.current = input;

      setState((state) => ({
        processing: true,
        resultStoreId: selectedStore.id,
        result: selectedStore.id === state.resultStoreId ? state.result : null,
      }));

      try {
        const { sets, combos, statRangesFiltered, processInfo, processTime } = await resultPromise;
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
      } finally {
        cleanup();
        cleanupRef.current = undefined;
      }
    };

    const timer = setTimeout(
      () => {
        doProcess();
      },
      firstTime ? 0 : 500,
    );

    return () => {
      clearTimeout(timer);
    };
  }, [
    filteredItems,
    selectedStore.id,
    desiredStatRanges,
    anyExotic,
    armorEnergyRules,
    autoStatMods,
    lockedModMap,
    getUserItemTag,
    modStatChanges,
    autoModDefs,
    strictUpgrades,
    firstTime,
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
