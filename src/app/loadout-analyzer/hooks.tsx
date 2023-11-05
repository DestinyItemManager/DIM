import { savedLoadoutParametersSelector } from 'app/dim-api/selectors';
import {
  allItemsSelector,
  createItemContextSelector,
  unlockedPlugSetItemsSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { getAutoMods } from 'app/loadout-builder/process/mappers';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { currySelector } from 'app/utils/selectors';
import { noop } from 'lodash';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { LoadoutBackgroundAnalyzer } from './store';
import { LoadoutAnalysisContext, LoadoutAnalysisResult, LoadoutAnalysisSummary } from './types';

const LoadoutAnalyzerReactContext = createContext<LoadoutBackgroundAnalyzer | null>(null);

const autoModSelector = createSelector(
  d2ManifestSelector,
  unlockedPlugSetItemsSelector.selector,
  (defs, unlockedPlugSetItems) => defs && getAutoMods(defs, unlockedPlugSetItems),
);

// It'd be really neat if this one didn't depend on the storeId but
// unlockedPlugSetItemsSelector and as a result, autoModSelector
// do need it.
const autoOptimizationContextSelector = currySelector(
  createSelector(
    createItemContextSelector,
    unlockedPlugSetItemsSelector.selector,
    allItemsSelector,
    savedLoadoutParametersSelector,
    autoModSelector,
    (itemCreationContext, unlockedPlugs, allItems, savedLoLoadoutParameters, autoModDefs) =>
      itemCreationContext.defs &&
      autoModDefs &&
      ({
        itemCreationContext,
        unlockedPlugs,
        savedLoLoadoutParameters,
        allItems,
        autoModDefs,
      } satisfies LoadoutAnalysisContext),
  ),
);

/** Wrapper component that holds the analyzer task and results. */
export function MakeLoadoutAnalysisAvailable({ children }: { children: ReactNode }) {
  const [analyzer, setAnalyzer] = useState<LoadoutBackgroundAnalyzer | null>(null);
  useEffect(() => {
    setAnalyzer(new LoadoutBackgroundAnalyzer());
    return () => {
      setAnalyzer((oldAnalyzer) => {
        oldAnalyzer?.destroy();
        return null;
      });
    };
  }, []);
  return (
    <LoadoutAnalyzerReactContext.Provider value={analyzer}>
      {children}
    </LoadoutAnalyzerReactContext.Provider>
  );
}

/**
 * Keep injecting an up-to-date loadout analysis context into the analyzer so that
 * it can keep analyzing loadouts when the user changes items etc.
 */
export function useUpdateLoadoutAnalysisContext(storeId: string) {
  const analyzer = useContext(LoadoutAnalyzerReactContext);
  const analysisContext = useSelector(autoOptimizationContextSelector(storeId));
  useEffect(
    () => analysisContext && analyzer?.updateAnalysisContext(storeId, analysisContext),
    [analysisContext, analyzer, storeId],
  );
}

/** Submit a single loadout to analysis. This will return undefined until results are available. */
export function useAnalyzeLoadout(
  loadout: Loadout,
  store: DimStore,
  active: boolean,
):
  | {
      outdated: boolean;
      result: LoadoutAnalysisResult;
    }
  | undefined {
  const id = useId();
  const analyzer = useContext(LoadoutAnalyzerReactContext);
  const subscribe = useCallback(
    (callback: () => void) =>
      active && analyzer
        ? analyzer.subscribeToLoadoutResult(id, store.id, store.classType, loadout, callback)
        : noop,
    [active, analyzer, id, loadout, store.classType, store.id],
  );
  const getSnapshot = useCallback(
    () => (active ? analyzer?.getLoadoutResults(store.id, loadout) : undefined),
    [active, analyzer, loadout, store.id],
  );
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** Bulk analyze loadouts, returning a summary with loadout IDs grouped by findings */
export function useSummaryLoadoutsAnalysis(
  loadouts: Loadout[],
  store: DimStore,
  active: boolean,
): LoadoutAnalysisSummary | undefined {
  const id = useId();
  const analyzer = useContext(LoadoutAnalyzerReactContext);
  const subscribe = useCallback(
    (callback: () => void) =>
      active && analyzer
        ? analyzer?.subscribeToSummary(id, store.id, store.classType, loadouts, callback)
        : noop,
    [active, analyzer, id, loadouts, store.classType, store.id],
  );
  const getSnapshot = useCallback(
    () => (active ? analyzer?.getSummary(id) : undefined),
    [active, analyzer, id],
  );
  return useSyncExternalStore(subscribe, getSnapshot);
}
