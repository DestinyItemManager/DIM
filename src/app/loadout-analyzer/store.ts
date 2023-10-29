import { Loadout } from 'app/loadout-drawer/loadout-types';
import { CancelToken, withCancel } from 'app/utils/cancel';
import { delay } from 'app/utils/promises';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _, { noop } from 'lodash';
import { analyzeLoadout } from './analysis';
import {
  LoadoutAnalysisContext,
  LoadoutAnalysisResult,
  LoadoutAnalysisSummary,
  LoadoutFinding,
} from './types';

interface Subscription {
  id: string;
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

export type ResultsForDimStore = WeakMap<
  Loadout,
  {
    result: LoadoutAnalysisResult;
    generationNumber: number;
    cachedReturnObject: { result: LoadoutAnalysisResult; outdated: boolean } | undefined;
  }
>;

interface AnalysisStore {
  localGenerationNumber: number;
  analysisContext: LoadoutAnalysisContext | undefined;
  resultsMap: ResultsForDimStore;
}

interface PokeToken {
  checkPoked: () => boolean;
}

function withPoke(): [PokeToken, () => void] {
  let isPoked = false;
  return [
    {
      checkPoked() {
        if (isPoked) {
          isPoked = false;
          return true;
        }
        return false;
      },
    },
    () => (isPoked = true),
  ];
}

export class LoadoutAnalysisStore {
  results: { [storeId: string]: AnalysisStore };
  subscriptions: { [id: string]: Subscription } | undefined;
  cancel: () => void;
  pokeWorker: () => void;
  generationNumber: number;

  constructor() {
    this.results = {};
    this.subscriptions = {};
    const [cancelToken, cancel] = withCancel();
    const [pokeToken, poke] = withPoke();
    this.cancel = cancel;
    this.pokeWorker = poke;
    this.generationNumber = 1;
    analysisTask(cancelToken, pokeToken, this);
  }

  destroy() {
    this.cancel();
    this.subscriptions = undefined;
  }

  private checkStoreInit(storeId: string) {
    this.results[storeId] ??= {
      localGenerationNumber: this.generationNumber,
      resultsMap: new WeakMap(),
      analysisContext: undefined,
    };
  }

  updateAnalysisContext(storeId: string, analysisContext: LoadoutAnalysisContext) {
    this.checkStoreInit(storeId);
    if (this.results[storeId].analysisContext !== analysisContext) {
      this.generationNumber += 1;
      this.results[storeId].localGenerationNumber = this.generationNumber;
      this.results[storeId].analysisContext = analysisContext;
      this.notifyAllSubscribers(storeId);
      this.pokeWorker();
    }
  }

  private notifyAllSubscribers(storeId: string) {
    if (!this.subscriptions) {
      return;
    }
    for (const subscription of Object.values(this.subscriptions)) {
      if (subscription.storeId === storeId) {
        subscription.callback();
      }
    }
  }

  subscribeToSummary(
    id: string,
    storeId: string,
    classType: DestinyClass,
    loadouts: Loadout[],
    callback: () => void
  ): () => void {
    if (!this.subscriptions) {
      return noop;
    }
    this.subscriptions[id] = {
      id,
      storeId,
      classType,
      callback,
      type: { tag: 'summary', loadouts, summary: undefined },
    };
    const unsubscribe = () => delete this.subscriptions?.[id];
    this.checkStoreInit(storeId);
    callback();
    this.pokeWorker();
    return unsubscribe;
  }

  getSummary(subscriptionId: string): LoadoutAnalysisSummary | undefined {
    const subscription = this.subscriptions?.[subscriptionId];
    if (!subscription) {
      return undefined;
    }
    return subscription.type.tag === 'summary' ? subscription.type.summary : undefined;
  }

  getLoadoutResults(storeId: string, loadout: Loadout) {
    this.checkStoreInit(storeId);
    const storeResult = this.results[storeId];
    const result = this.results[storeId].resultsMap.get(loadout);
    if (!result) {
      return undefined;
    }
    const isOutdated = result.generationNumber < storeResult.localGenerationNumber;
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

  subscribeToLoadoutResult(
    id: string,
    storeId: string,
    classType: DestinyClass,
    loadout: Loadout,
    callback: () => void
  ): () => void {
    if (!this.subscriptions) {
      return noop;
    }
    this.subscriptions[id] = {
      id,
      storeId,
      classType,
      callback,
      type: { tag: 'loadoutResults', loadout },
    };
    const unsubscribe = () => delete this.subscriptions?.[id];
    this.checkStoreInit(storeId);
    callback();
    this.pokeWorker();
    return unsubscribe;
  }

  setAnalysisResult(
    storeId: string,
    loadout: Loadout,
    generationNumber: number,
    results: LoadoutAnalysisResult
  ) {
    const store = this.results[storeId];
    const result = store.resultsMap.get(loadout);
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

  private updateSummary(subscription: Subscription) {
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
          [LoadoutFinding.DoesNotSatisfyStatConstraints]: new Set(),
          [LoadoutFinding.LoadoutHasSearchQuery]: new Set(),
        },
      };

      const store = this.results[subscription.storeId];
      for (const loadout of subscription.type.loadouts) {
        const result = store.resultsMap.get(loadout);
        if (result) {
          summary.analyzedLoadouts += 1;
          if (result.generationNumber < store.localGenerationNumber) {
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
    if (this.subscriptions) {
      for (const subscription of Object.values(this.subscriptions)) {
        if (subscription.storeId === storeId && subscription.type.tag === 'summary') {
          this.updateSummary(subscription);
        }
      }
    }
  }

  getNextLoadoutToAnalyze() {
    if (!this.subscriptions) {
      return undefined;
    }

    const loadoutsAwaitingAnalysis = Object.values(this.subscriptions).flatMap((subscription) => {
      const existingStore = this.results[subscription.storeId];
      if (!existingStore.analysisContext) {
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
            existingStore.localGenerationNumber - existingResults.generationNumber
          : // This loadout has no results - prioritize it
            Number.MAX_SAFE_INTEGER;

        return {
          loadout,
          outOfDateNess,
          analysisContext: existingStore.analysisContext!,
          storeId: subscription.storeId,
          classType: subscription.classType,
          generationNumber: existingStore.localGenerationNumber,
        };
      });
    });

    const mostOutOfDateLoadout = _.maxBy(loadoutsAwaitingAnalysis, (l) => l.outOfDateNess);
    return mostOutOfDateLoadout?.outOfDateNess === 0 ? undefined : mostOutOfDateLoadout;
  }
}

export async function analysisTask(
  cancelToken: CancelToken,
  pokeToken: PokeToken,
  store: LoadoutAnalysisStore
) {
  const sleepUntilUpdate = async () => {
    while (!pokeToken.checkPoked()) {
      await delay(0);
    }
  };
  while (!cancelToken.canceled && store.subscriptions) {
    const task = store.getNextLoadoutToAnalyze();

    if (!task) {
      await sleepUntilUpdate();
      continue;
    }

    const result = await analyzeLoadout(
      task.analysisContext,
      task.storeId,
      task.classType,
      task.loadout
    );
    store.setAnalysisResult(task.storeId, task.loadout, task.generationNumber, result);
  }
}
