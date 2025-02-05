import { currentAccountSelector } from 'app/accounts/selectors';
import { savedLoStatConstraintsByClassSelector } from 'app/dim-api/selectors';
import {
  allItemsSelector,
  createItemContextSelector,
  unlockedPlugSetItemsSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { loVendorItemsSelector } from 'app/loadout-builder/loadout-builder-vendors';
import { getAutoMods } from 'app/loadout-builder/process/mappers';
import { Loadout } from 'app/loadout/loadout-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { filterFactorySelector, validateQuerySelector } from 'app/search/items/item-search-filter';
import { noop } from 'app/utils/functions';
import { currySelector } from 'app/utils/selectors';
import { useLoadVendors } from 'app/vendors/hooks';
import {
  ReactNode,
  createContext,
  use,
  useCallback,
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
    savedLoStatConstraintsByClassSelector,
    autoModSelector,
    allItemsSelector,
    loVendorItemsSelector.selector,
    filterFactorySelector,
    validateQuerySelector,
    (
      itemCreationContext,
      unlockedPlugs,
      savedLoStatConstraintsByClass,
      autoModDefs,
      inventoryItems,
      vendorItems,
      filterFactory,
      validateQuery,
    ) => {
      const allItems = inventoryItems.concat(vendorItems);
      return (
        itemCreationContext.defs &&
        autoModDefs &&
        ({
          itemCreationContext,
          unlockedPlugs,
          savedLoStatConstraintsByClass,
          autoModDefs,
          allItems,
          filterFactory,
          validateQuery,
        } satisfies LoadoutAnalysisContext)
      );
    },
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
  return <LoadoutAnalyzerReactContext value={analyzer}>{children}</LoadoutAnalyzerReactContext>;
}

/**
 * Keep injecting an up-to-date loadout analysis context into the analyzer so that
 * it can keep analyzing loadouts when the user changes items etc.
 */
export function useUpdateLoadoutAnalysisContext(storeId: string) {
  const account = useSelector(currentAccountSelector)!;
  const analyzer = use(LoadoutAnalyzerReactContext);
  const analysisContext = useSelector(autoOptimizationContextSelector(storeId));

  useLoadVendors(account, storeId);

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
  const analyzer = use(LoadoutAnalyzerReactContext);
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
  const analyzer = use(LoadoutAnalyzerReactContext);
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
