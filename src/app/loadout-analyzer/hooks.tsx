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
import { RootState } from 'app/store/types';
import { currySelector } from 'app/utils/selectors';
import { noop } from 'lodash';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
} from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { LoadoutAnalysisStore } from './store';
import { LoadoutAnalysisContext, LoadoutAnalysisResult, LoadoutAnalysisSummary } from './types';

const LoadoutAnalyzerReactContext = createContext<LoadoutAnalysisStore | null>(null);

const autoModSelector = createSelector(
  d2ManifestSelector,
  unlockedPlugSetItemsSelector.selector,
  (defs, unlockedPlugSetItems) => defs && getAutoMods(defs, unlockedPlugSetItems)
);

const autoOptimizationContextSelector = currySelector(
  createSelector(
    (_state: RootState, storeId: string) => storeId,
    createItemContextSelector,
    unlockedPlugSetItemsSelector.selector,
    allItemsSelector,
    savedLoadoutParametersSelector,
    autoModSelector,
    (
      _storeId,
      itemCreationContext,
      unlockedPlugs,
      allItems,
      savedLoLoadoutParameters,
      autoModDefs
    ) =>
      itemCreationContext.defs &&
      autoModDefs &&
      ({
        itemCreationContext,
        unlockedPlugs,
        savedLoLoadoutParameters,
        allItems,
        autoModDefs,
      } satisfies LoadoutAnalysisContext)
  )
);

export function MakeLoadoutAnalysisAvailable({ children }: { children: ReactNode }) {
  const analyzer = useRef(new LoadoutAnalysisStore());
  return (
    <LoadoutAnalyzerReactContext.Provider value={analyzer.current}>
      {children}
    </LoadoutAnalyzerReactContext.Provider>
  );
}

export function useUpdateLoadoutAnalysisContext(storeId: string) {
  const analyzer = useContext(LoadoutAnalyzerReactContext);
  if (!analyzer) {
    throw new Error('Need an analysis context');
  }
  const analysisContext = useSelector(autoOptimizationContextSelector(storeId));
  useEffect(
    () => analysisContext && analyzer.updateAnalysisContext(storeId, analysisContext),
    [analysisContext, analyzer, storeId]
  );
}

/** Submit a single loadout to analyis. This will return undefined until results are available. */
export function useAnalyzeLoadout(
  loadout: Loadout,
  store: DimStore,
  active: boolean
):
  | {
      outdated: boolean;
      result: LoadoutAnalysisResult;
    }
  | undefined {
  const id = useId();
  const analyzer = useContext(LoadoutAnalyzerReactContext);
  if (active && !analyzer) {
    throw new Error('Need an analysis context');
  }
  const subscribe = useCallback(
    (callback: () => void) =>
      active
        ? analyzer!.subscribeToLoadoutResult(id, store.id, store.classType, loadout, callback)
        : noop,
    [active, analyzer, id, loadout, store.classType, store.id]
  );
  const getSnapshot = useCallback(
    () => (active ? analyzer!.getLoadoutResults(store.id, loadout) : undefined),
    [active, analyzer, loadout, store.id]
  );
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function useSummaryLoadoutsAnalysis(
  loadouts: Loadout[],
  store: DimStore,
  active: boolean
): LoadoutAnalysisSummary | undefined {
  const id = useId();
  const analyzer = useContext(LoadoutAnalyzerReactContext);
  if (!analyzer) {
    throw new Error('Need an analysis context');
  }
  const subscribe = useCallback(
    (callback: () => void) =>
      active
        ? analyzer.subscribeToSummary(id, store.id, store.classType, loadouts, callback)
        : noop,
    [active, analyzer, id, loadouts, store.classType, store.id]
  );
  const getSnapshot = useCallback(
    () => (active ? analyzer.getSummary(id) : undefined),
    [active, analyzer, id]
  );
  return useSyncExternalStore(subscribe, getSnapshot);
}
