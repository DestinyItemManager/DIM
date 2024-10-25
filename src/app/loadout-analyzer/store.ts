import { runProcess } from 'app/loadout-builder/process/process-wrapper';
import { Loadout } from 'app/loadout/loadout-types';
import { CancelToken, withCancel } from 'app/utils/cancel';
import { noop } from 'app/utils/functions';
import { errorLog } from 'app/utils/log';
import { reportException } from 'app/utils/sentry';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { maxBy } from 'es-toolkit';
import { analyzeLoadout } from './analysis';
import {
  LoadoutAnalysisContext,
  LoadoutAnalysisResult,
  LoadoutAnalysisSummary,
  LoadoutFinding,
} from './types';

interface Request {
  subscriptionId: string;
  storeId: string;
  classType: DestinyClass;
  callback: () => void;
  type:
    | {
        tag: 'summary';
        loadouts: Loadout[];
        summary: LoadoutAnalysisSummary | undefined;
      }
    | {
        tag: 'loadoutResults';
        loadout: Loadout;
      };
}

type ResultsForDimStore = WeakMap<
  Loadout,
  {
    result: LoadoutAnalysisResult;
    generationNumber: number;
    cachedReturnObject: { result: LoadoutAnalysisResult; outdated: boolean } | undefined;
  }
>;

/**
 * The context and results for a given DIM storeId.
 * Since the context annoyingly contains character-specific things
 * (mostly due to mod cost reductions), each store has its own copy
 * of the context. The generationNumber is incremented whenever a
 * referentially new analysisContext comes in, which triggers
 * recomputing.
 */
interface AnalysisStore {
  context:
    | {
        generationNumber: number;
        analysisContext: LoadoutAnalysisContext;
      }
    | undefined;
  resultsMap: ResultsForDimStore;
}

export class LoadoutBackgroundAnalyzer {
  stores: { [storeId: string]: AnalysisStore };
  requests: { [id: string]: Request } | undefined;
  cancel: () => void;
  wakeupWorker: () => void;

  constructor() {
    this.stores = {};
    this.requests = {};
    const [cancelToken, cancel] = withCancel();
    this.cancel = cancel;
    this.wakeupWorker = noop;
    analysisTask(cancelToken, this);
  }

  destroy() {
    this.cancel();
    this.requests = undefined;
    this.wakeupWorker();
  }

  private checkStoreInit(storeId: string) {
    this.stores[storeId] ??= {
      resultsMap: new WeakMap(),
      context: undefined,
    };
  }

  /**
   * Inject the analysis context for loadouts. Since this object isn't managed
   * by React or Redux, consumers of loadout analysis need to keep selecting
   * the context for the storeId(s) the user is looking at and send the context here.
   */
  updateAnalysisContext(storeId: string, analysisContext: LoadoutAnalysisContext) {
    this.checkStoreInit(storeId);
    const store = this.stores[storeId];
    if (store.context?.analysisContext === analysisContext) {
      return;
    } else if (!store.context) {
      store.context = { analysisContext, generationNumber: 1 };
    } else {
      store.context.generationNumber += 1;
      store.context.analysisContext = analysisContext;
    }
    // We've updated the context, so results should be considered stale
    // Tell subscribers and make the worker continue.
    this.updateSummaries(storeId);
    this.notifyAllSubscribers(storeId);
    this.wakeupWorker();
  }

  /**
   * Notifies all subscribers that things may have changed for the given storeId.
   */
  private notifyAllSubscribers(storeId: string) {
    if (!this.requests) {
      return;
    }
    for (const subscription of Object.values(this.requests)) {
      if (subscription.storeId === storeId) {
        subscription.callback();
      }
    }
  }

  /**
   * Submit a bunch of loadouts for analysis with the given store and classType.
   * Will call `callback` if there may be results, at which point
   * you can call `getSummary` to get them.
   */
  subscribeToSummary(
    id: string,
    storeId: string,
    classType: DestinyClass,
    loadouts: Loadout[],
    callback: () => void,
  ): () => void {
    if (!this.requests) {
      return noop;
    }
    this.requests[id] = {
      subscriptionId: id,
      storeId,
      classType,
      callback,
      type: { tag: 'summary', loadouts, summary: undefined },
    };
    const unsubscribe = () => delete this.requests?.[id];
    this.checkStoreInit(storeId);
    this.updateSummary(this.requests[id]);
    callback();
    this.wakeupWorker();
    return unsubscribe;
  }

  /**
   * Submit a loadout for analysis with the given store and classType.
   * Will call `callback` if there may be results, at which point
   * you can call `getLoadoutResults` to get them.
   */
  subscribeToLoadoutResult(
    id: string,
    storeId: string,
    classType: DestinyClass,
    loadout: Loadout,
    callback: () => void,
  ): () => void {
    if (!this.requests) {
      return noop;
    }
    this.requests[id] = {
      subscriptionId: id,
      storeId,
      classType,
      callback,
      type: { tag: 'loadoutResults', loadout },
    };
    const unsubscribe = () => delete this.requests?.[id];
    this.checkStoreInit(storeId);
    this.wakeupWorker();
    return unsubscribe;
  }

  getSummary(subscriptionId: string): LoadoutAnalysisSummary | undefined {
    const subscription = this.requests?.[subscriptionId];
    if (!subscription) {
      return undefined;
    }
    return subscription.type.tag === 'summary' ? subscription.type.summary : undefined;
  }

  getLoadoutResults(storeId: string, loadout: Loadout) {
    this.checkStoreInit(storeId);
    const storeResult = this.stores[storeId];
    const result = this.stores[storeId].resultsMap.get(loadout);
    if (!result) {
      return undefined;
    }
    const isOutdated =
      !storeResult.context || result.generationNumber < storeResult.context.generationNumber;
    // React uses referential identity to determine whether to re-render, so the return
    // value must be different if properties are different.
    if (
      !result.cachedReturnObject ||
      result.cachedReturnObject.outdated !== isOutdated ||
      result.cachedReturnObject.result !== result.result
    ) {
      result.cachedReturnObject = { outdated: isOutdated, result: result.result };
    }
    return result.cachedReturnObject;
  }

  /**
   * Callback from the worker task when results are there.
   */
  setAnalysisResult(
    storeId: string,
    loadout: Loadout,
    generationNumber: number,
    results: LoadoutAnalysisResult,
  ) {
    const store = this.stores[storeId];
    const result = store.resultsMap.get(loadout);
    // Only store the results if it's actually newer
    if (!result || result.generationNumber < generationNumber) {
      store.resultsMap.set(loadout, {
        result: results,
        generationNumber,
        cachedReturnObject: undefined,
      });
    }
    this.updateSummaries(storeId);
    this.notifyAllSubscribers(storeId);
  }

  private updateSummary(subscription: Request) {
    if (subscription.type.tag === 'summary') {
      const summary: LoadoutAnalysisSummary = {
        analyzedLoadouts: 0,
        outdated: false,
        loadoutsByFindings: {
          [LoadoutFinding.MissingItems]: new Set(),
          [LoadoutFinding.InvalidMods]: new Set(),
          [LoadoutFinding.EmptyFragmentSlots]: new Set(),
          [LoadoutFinding.TooManyFragments]: new Set(),
          [LoadoutFinding.NeedsArmorUpgrades]: new Set(),
          [LoadoutFinding.BetterStatsAvailable]: new Set(),
          [LoadoutFinding.NotAFullArmorSet]: new Set(),
          [LoadoutFinding.DoesNotRespectExotic]: new Set(),
          [LoadoutFinding.ModsDontFit]: new Set(),
          [LoadoutFinding.UsesSeasonalMods]: new Set(),
          [LoadoutFinding.DoesNotSatisfyStatConstraints]: new Set(),
          [LoadoutFinding.InvalidSearchQuery]: new Set(),
        },
      };

      const store = this.stores[subscription.storeId];
      for (const loadout of subscription.type.loadouts) {
        const result = store.resultsMap.get(loadout);
        if (result) {
          summary.analyzedLoadouts += 1;
          if (!store.context || result.generationNumber < store.context.generationNumber) {
            summary.outdated = true;
          }
          for (const finding of result.result.findings) {
            summary.loadoutsByFindings[finding].add(loadout.id);
          }
        }
      }

      subscription.type.summary = summary;
    } else {
      throw new Error('only call this with subscriptions for summaries');
    }
  }

  private updateSummaries(storeId: string) {
    if (this.requests) {
      for (const subscription of Object.values(this.requests)) {
        if (subscription.storeId === storeId && subscription.type.tag === 'summary') {
          this.updateSummary(subscription);
        }
      }
    }
  }

  getNextLoadoutToAnalyze() {
    if (!this.requests) {
      return undefined;
    }

    const loadoutsAwaitingAnalysis = Object.values(this.requests).flatMap((subscription) => {
      const existingStore = this.stores[subscription.storeId];
      if (!existingStore.context) {
        return [];
      }
      const loadouts =
        subscription.type.tag === 'summary'
          ? subscription.type.loadouts
          : [subscription.type.loadout];
      return loadouts.map((loadout) => {
        const existingResults = existingStore.resultsMap.get(loadout);
        const outOfDateNess = existingResults
          ? // This loadout has been analysed but we have some results - check how far out of date the result is
            existingStore.context!.generationNumber - existingResults.generationNumber
          : // This loadout has no results - prioritize it
            Number.MAX_SAFE_INTEGER;

        return {
          loadout,
          outOfDateNess:
            // Bump the priority of single analysis requests
            subscription.type.tag === 'loadoutResults' ? outOfDateNess * 100 : outOfDateNess,
          analysisContext: existingStore.context!.analysisContext,
          storeId: subscription.storeId,
          classType: subscription.classType,
          generationNumber: existingStore.context!.generationNumber,
        };
      });
    });

    const mostOutOfDateLoadout = maxBy(loadoutsAwaitingAnalysis, (l) => l.outOfDateNess);
    return mostOutOfDateLoadout?.outOfDateNess === 0 ? undefined : mostOutOfDateLoadout;
  }
}

async function analysisTask(cancelToken: CancelToken, analyzer: LoadoutBackgroundAnalyzer) {
  while (!cancelToken.canceled && analyzer.requests) {
    const task = analyzer.getNextLoadoutToAnalyze();

    if (!task) {
      // The main scenario to avoid here is a wakeupWorker call
      // coming in after we find out there's nothing to do but before
      // we set wakeupWorker for the next promise, which is prevented
      // by the fact that there's no await before this and the Promise
      // executor is called synchronously.
      const promise = new Promise((resolve) => {
        analyzer.wakeupWorker = () => resolve(null);
      });
      await promise;
      continue;
    }

    let result: LoadoutAnalysisResult;
    try {
      result = await analyzeLoadout(
        task.analysisContext,
        task.storeId,
        task.classType,
        task.loadout,
        runProcess,
      );
    } catch (e) {
      // Report to sentry, but still set a dummy result so that we don't end up
      // showing a "busy" spinner or try this and crash over and over again.
      errorLog('loadout analysis', 'internal error', e);
      reportException('loadout analysis', e);
      result = {
        findings: [],
        armorResults: undefined,
        betterStatsAvailableFontNote: false,
      };
    }
    analyzer.setAnalysisResult(task.storeId, task.loadout, task.generationNumber, result);
  }
}
