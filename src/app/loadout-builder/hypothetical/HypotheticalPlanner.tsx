import { SetBonusCounts } from '@destinyitemmanager/dim-api-types';
import BungieImage from 'app/dim-ui/BungieImage';
import CheckButton from 'app/dim-ui/CheckButton';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { calculateAssumedMasterworkStats } from 'app/loadout-drawer/loadout-utils';
import { calculateAssumedItemEnergy } from 'app/loadout/armor-upgrade-utils';
import { ModMap } from 'app/loadout/mod-assignment-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { armorStats } from 'app/search/d2-known-values';
import { filterMap, mapValues, sumBy } from 'app/utils/collections';
import { getArmor3StatFocus } from 'app/utils/item-utils';
import { errorLog } from 'app/utils/log';
import { getArmorArchetype } from 'app/utils/socket-utils';
import { releaseProxy, wrap } from 'comlink';
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { allItemsSelector } from '../../inventory/selectors';
import { mapAutoMods } from '../process/mappers';
import { useAutoMods } from '../process/useProcess';
import {
  ArmorBucketHashes,
  ArmorEnergyRules,
  ArmorStats,
  DesiredStatRange,
  ItemsByBucket,
  LOCKED_EXOTIC_ANY_EXOTIC,
  ModStatChanges,
  PinnedItems,
} from '../types';
import {
  buildHypotheticalBlocks,
  deriveArmor3ArchetypeModel,
  isArmor3ModelSourceItem,
  MAX_GEAR_TIER,
  SetBonusRequirement,
  tuningVariantStats,
} from './hypothetical-items';
import * as styles from './HypotheticalPlanner.m.scss';
import {
  PlannerExoticMode,
  PlannerInputs,
  PlannerPiece,
  PlannerResult,
  totalFarmCount,
} from './planner';

const modEnergyCost = (mod: PluggableInventoryItemDefinition) =>
  mod.plug.energyCost?.energyCost ?? 0;

function createPlannerWorker() {
  const instance = new Worker(
    /* webpackChunkName: "planner-worker" */ new URL('./PlannerWorker', import.meta.url),
    { type: 'module' },
  );
  const worker = wrap<import('./PlannerWorker').PlannerWorker>(instance);
  const cleanup = () => {
    worker[releaseProxy]();
    instance.terminate();
  };
  return { worker, cleanup };
}

interface PlanState {
  result: PlannerResult;
  planTimeMs: number;
}

/**
 * Run the planner in a web worker whenever the inputs change, keeping the
 * last result while a new one computes. A still-running computation is
 * terminated (worker and all) when new inputs arrive so stale work never
 * blocks fresh work — the search is synchronous inside the worker, so
 * termination is the only way to cancel it. An idle worker is deliberately
 * kept alive between runs to skip the spawn cost on the common path.
 */
function usePlannerWorker(inputs: PlannerInputs | undefined): PlanState | undefined {
  const [planState, setPlanState] = useState<PlanState>();
  const workerRef = useRef<ReturnType<typeof createPlannerWorker>>(undefined);
  const busyRef = useRef(false);

  useEffect(
    () => () => {
      workerRef.current?.cleanup();
      workerRef.current = undefined;
    },
    [],
  );

  useEffect(() => {
    if (!inputs) {
      setPlanState(undefined);
      return;
    }
    if (busyRef.current) {
      // The previous computation is still running on stale inputs — kill it.
      workerRef.current?.cleanup();
      workerRef.current = undefined;
    }
    workerRef.current ??= createPlannerWorker();
    busyRef.current = true;
    let cancelled = false;
    const start = performance.now();
    workerRef.current.worker.planForTargets(inputs).then(
      (result) => {
        busyRef.current = false;
        if (!cancelled) {
          setPlanState({ result, planTimeMs: performance.now() - start });
        }
      },
      (e: unknown) => {
        busyRef.current = false;
        if (!cancelled) {
          errorLog('planner prototype', 'planner worker failed', e);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [inputs]);

  return planState;
}

/**
 * Stat-target planner — https://github.com/DestinyItemManager/DIM/issues/11832
 *
 * Answers "what armor do I still need to farm to hit these stat targets?"
 * Keeps as many owned pieces as possible (the locked exotic, pinned items,
 * and pieces contributing to required set bonuses included) and fills the
 * remaining slots with ideal hypothetical drops. The search itself runs in a
 * web worker (see planner.ts / PlannerWorker.ts).
 */
export default memo(function HypotheticalPlanner({
  desiredStatRanges,
  filteredItems,
  pinnedItems,
  lockedExoticHash,
  setBonuses,
  modStatChanges,
  armorEnergyRules,
  autoStatMods,
  lockedModMap,
  storeId,
  ownedSets,
  className,
}: {
  desiredStatRanges: DesiredStatRange[];
  filteredItems: ItemsByBucket;
  pinnedItems: PinnedItems;
  lockedExoticHash: number | undefined;
  setBonuses: SetBonusCounts;
  modStatChanges: ModStatChanges;
  armorEnergyRules: ArmorEnergyRules;
  autoStatMods: boolean;
  lockedModMap: ModMap;
  storeId: string;
  /**
   * Whether the real Loadout Optimizer worker found sets meeting the targets
   * from owned armor. The worker models things the planner doesn't (artifice
   * sockets, every exotic copy), so when it found sets there's nothing to farm
   * no matter what the planner's model says. 'pending' means it's still
   * searching — we say nothing rather than tell someone to farm for a build
   * that's about to resolve as already buildable.
   */
  ownedSets: 'pending' | 'found' | 'none';
  className?: string;
}) {
  const defs = useD2Definitions()!;
  const allItems = useSelector(allItemsSelector);
  const autoModDefs = useAutoMods(storeId);

  // Whether to build around owned armor (minimize farming) or plan the ideal
  // build from drops alone. The locked exotic and pins are respected either way.
  const [keepOwned, setKeepOwned] = useState(true);

  // Opt-in: this is extra work on top of what LO already does, so it stays off
  // until asked for. Gating `inputs` (not just the rendering) is what makes it
  // an actual off switch — collapsing the section would still run the worker.
  const [enabled, setEnabled] = useState(false);

  // Let stat slider drags repaint before we recompute the plan.
  const deferredStatRanges = useDeferredValue(desiredStatRanges);

  // Whether the section renders at all — a cheap probe, unlike the model.
  const hasModelSource = useMemo(() => allItems.some(isArmor3ModelSourceItem), [allItems]);

  // Deriving the model scans all items (and, once per manifest, the whole
  // InventoryItem table), so don't pay for it until the feature is enabled.
  const modelAndBlocks = useMemo(() => {
    if (!enabled) {
      return undefined;
    }
    const model = deriveArmor3ArchetypeModel(allItems, defs);
    return model && { model, blocks: buildHypotheticalBlocks(model) };
  }, [enabled, allItems, defs]);

  const hasTargets = deferredStatRanges.some((r) => r.maxStat > 0 && r.minStat > 0);
  // Farmed pieces only get credit for their tuning slot when there's a stat to
  // dump the paired -5 into, so say so when there isn't one.
  const hasIgnoredStat = deferredStatRanges.some((r) => r.maxStat === 0);

  // What the +10/+5 general mods cost per stat, via the LO worker's own mapping.
  const autoModCosts = useMemo(
    () =>
      mapValues(mapAutoMods(autoModDefs).generalMods, (mods) =>
        mods ? { major: mods.majorMod.cost, minor: mods.minorMod.cost } : undefined,
      ),
    [autoModDefs],
  );

  // Energy consumed on each slot by locked bucket-specific mods (helmet mods etc.).
  const bucketSpecificCosts = useMemo(
    () =>
      ArmorBucketHashes.map((bucketHash) =>
        sumBy(lockedModMap.bucketSpecificMods[bucketHash] ?? [], modEnergyCost),
      ),
    [lockedModMap],
  );

  // Identify the exact roll: "Geomag Stabilizers (Grenadier / Class)".
  const describeItem = useCallback(
    (item: DimItem) => {
      const archetypeName = getArmorArchetype(item)?.displayProperties.name;
      const focus = getArmor3StatFocus(item);
      const tertiaryName =
        focus.length === 3 ? defs.Stat.get(focus[2])?.displayProperties.name : undefined;
      return archetypeName && tertiaryName
        ? `${item.name} (${archetypeName} / ${tertiaryName})`
        : item.name;
    },
    [defs],
  );

  // Plain candidate pieces for the worker, plus the id → DimItem mapping to
  // resolve its answer back to real items. Computed once per inventory change
  // rather than per stat-slider change.
  const mapped = useMemo(() => {
    const itemsById = new Map<string, DimItem>();
    const piecesByBucket = ArmorBucketHashes.map((bucketHash, bucketIdx) =>
      filteredItems[bucketHash]
        // Guard against stat-less (e.g. classified) items poisoning sums with NaN
        .filter((item) => item.stats?.length)
        .flatMap((item): PlannerPiece[] => {
          itemsById.set(item.id, item);
          const stats = calculateAssumedMasterworkStats(item, armorEnergyRules);
          const piece: PlannerPiece = {
            id: item.id,
            itemId: item.id,
            isExotic: item.isExotic,
            name: describeItem(item),
            stats: stats as ArmorStats,
            setBonusHash: item.setBonus?.hash,
            energy:
              calculateAssumedItemEnergy(item, armorEnergyRules) - bucketSpecificCosts[bucketIdx],
          };
          // One candidate per way the item's tuning slot could be plugged. The
          // untuned piece stays in the running — a tuning mod always dumps a
          // stat somewhere, which isn't always worth the stat it adds.
          return [
            piece,
            ...tuningVariantStats(item, stats).map(
              ({ modHash, stats: tunedStats }): PlannerPiece => {
                const variantId = `${item.id}|tuned|${modHash}`;
                itemsById.set(variantId, item);
                return { ...piece, id: variantId, stats: tunedStats as ArmorStats };
              },
            ),
          ];
        }),
    );
    return { piecesByBucket, itemsById };
  }, [filteredItems, armorEnergyRules, describeItem, bucketSpecificCosts]);

  const inputs = useMemo((): PlannerInputs | undefined => {
    if (!enabled || !modelAndBlocks || !hasTargets) {
      return undefined;
    }

    let exoticMode: PlannerExoticMode = { type: 'none' };
    if (lockedExoticHash === LOCKED_EXOTIC_ANY_EXOTIC) {
      exoticMode = { type: 'any' };
    } else if (lockedExoticHash !== undefined && lockedExoticHash > 0) {
      const bucketHash = defs.InventoryItem.get(lockedExoticHash)?.inventory?.bucketTypeHash;
      const bucketIndex = bucketHash !== undefined ? ArmorBucketHashes.indexOf(bucketHash) : -1;
      if (bucketIndex >= 0) {
        exoticMode = { type: 'locked', bucketIndex };
      }
    }

    const setBonusRequirements: SetBonusRequirement[] = Object.keys(setBonuses)
      .map((setHash) => ({
        setHash: Number(setHash),
        count: setBonuses[Number(setHash)] ?? 0,
      }))
      .filter((r) => r.count > 0);

    return {
      blocks: modelAndBlocks.blocks,
      desiredStatRanges: deferredStatRanges,
      modStatTotals: mapValues(modStatChanges, (stat) => stat.value),
      piecesByBucket: mapped.piecesByBucket,
      pinnedIds: ArmorBucketHashes.map((bucketHash) => pinnedItems[bucketHash]?.id),
      exoticMode,
      keepOwned,
      setBonusRequirements,
      // Mirror the worker (process-utils' precalculateStructures): auto stat
      // mods use the general sockets not taken by user-locked general mods,
      // and none at all when the toggle is off.
      numGeneralMods: autoStatMods ? Math.max(0, 5 - lockedModMap.generalMods.length) : 0,
      autoModCosts,
      lockedGeneralModCosts: lockedModMap.generalMods.map(modEnergyCost),
      bucketSpecificCosts,
    };
  }, [
    modelAndBlocks,
    hasTargets,
    deferredStatRanges,
    lockedExoticHash,
    defs,
    mapped,
    pinnedItems,
    setBonuses,
    modStatChanges,
    autoStatMods,
    autoModCosts,
    lockedModMap,
    bucketSpecificCosts,
    keepOwned,
    enabled,
  ]);

  const planState = usePlannerWorker(inputs);

  if (!hasModelSource) {
    return null;
  }

  const plan = planState?.result;
  const farmCount = plan ? totalFarmCount(plan.farm) : 0;
  const keepItems: DimItem[] = plan
    ? filterMap([plan.exoticId, ...plan.keepIds], (id) =>
        id !== undefined ? mapped.itemsById.get(id) : undefined,
      )
    : [];
  // The worker is ground truth for owned armor — it models artifice sockets and
  // every exotic copy, which the planner's model doesn't.
  const alreadyBuildable = keepOwned && ownedSets === 'found';
  // Its verdict decides whether we say anything at all, so wait for it.
  const awaitingWorker = keepOwned && ownedSets === 'pending';

  const modLines = plan
    ? armorStats.flatMap((statHash) => {
        const statDef = defs.Stat.get(statHash);
        const stat = statDef?.displayProperties.name ?? statHash;
        const kinds = [
          {
            suffix: 'major',
            numMods: plan.modsPerStat[statHash],
            label: t('LoadoutBuilder.FarmingPlannerMod', { stat }),
          },
          {
            suffix: 'minor',
            numMods: plan.minorModsPerStat[statHash],
            label: t('LoadoutBuilder.FarmingPlannerModMinor', { stat }),
          },
          {
            suffix: 'tuning',
            numMods: plan.tunesPerStat[statHash],
            label: t('LoadoutBuilder.FarmingPlannerTuning', { stat }),
          },
        ];
        return kinds
          .filter(({ numMods }) => numMods > 0)
          .map(({ suffix, numMods, label }) => ({
            key: `${statHash}-${suffix}`,
            numMods,
            label,
            statDef,
          }));
      })
    : [];

  // The single outcome line. The worker-verified "already buildable" and the
  // planner's own zero-farm result read the same to the user.
  let verdict: string | undefined;
  if (plan) {
    if (alreadyBuildable || (plan.shortfall === 0 && farmCount === 0)) {
      verdict = t('LoadoutBuilder.FarmingPlannerAlreadyBuildable');
    } else if (plan.shortfall > 0) {
      verdict = t('LoadoutBuilder.FarmingPlannerUnreachable', { points: plan.shortfall });
    } else if (keepOwned) {
      verdict = t('LoadoutBuilder.FarmingPlannerNeed', { count: farmCount });
    } else {
      verdict = t('LoadoutBuilder.FarmingPlannerNeedIdeal', { count: farmCount });
    }
  }

  return (
    <CollapsibleTitle
      title={t('LoadoutBuilder.FarmingPlanner')}
      sectionId="lo-farming-planner"
      className={className}
    >
      <CheckButton name="lo-farming-planner-enabled" checked={enabled} onChange={setEnabled}>
        {t('LoadoutBuilder.FarmingPlannerEnable')}
      </CheckButton>
      {enabled && (
        <CheckButton
          name="lo-farming-planner-keep-owned"
          checked={keepOwned}
          onChange={setKeepOwned}
        >
          {t('LoadoutBuilder.FarmingPlannerKeepOwned')}
        </CheckButton>
      )}
      {!enabled ? null : !hasTargets ? (
        <div className={styles.fineprint}>{t('LoadoutBuilder.FarmingPlannerNoTargets')}</div>
      ) : (
        plan &&
        planState &&
        !awaitingWorker && (
          <>
            <div className={styles.verdict}>{verdict}</div>
            {!alreadyBuildable && (
              <>
                {farmCount > 0 && (
                  <ul className={styles.recipe}>
                    {plan.farm.map(({ block, count }) => {
                      const archetypeDef = defs.InventoryItem.get(block.archetypePlugHash);
                      const statDef = defs.Stat.get(block.tertiaryStatHash);
                      return (
                        <li key={`${block.archetypePlugHash}-${block.tertiaryStatHash}`}>
                          <span className={styles.count}>{count}×</span>
                          {archetypeDef && (
                            <BungieImage
                              className={styles.icon}
                              src={archetypeDef.displayProperties.icon}
                            />
                          )}
                          <span>{block.archetypeName}</span>
                          <span className={styles.tertiary}>
                            {statDef && (
                              <BungieImage
                                className={styles.icon}
                                src={statDef.displayProperties.icon}
                              />
                            )}
                            {statDef?.displayProperties.name}
                          </span>
                        </li>
                      );
                    })}
                    {plan.farmExotic && !plan.anyExoticMissing && (
                      <li className={styles.setNote}>
                        {t('LoadoutBuilder.FarmingPlannerFarmExotic')}
                      </li>
                    )}
                    {plan.farmFromSets.map(({ setHash, count }) => (
                      <li key={setHash} className={styles.setNote}>
                        {t('LoadoutBuilder.FarmingPlannerFromSet', {
                          numPieces: count,
                          set:
                            defs.EquipableItemSet.get(setHash)?.displayProperties.name ?? setHash,
                        })}
                      </li>
                    ))}
                  </ul>
                )}
                {modLines.length > 0 && (
                  <ul className={styles.recipe}>
                    {modLines.map(({ key, numMods, label, statDef }) => (
                      <li key={key}>
                        <span className={styles.count}>{numMods}×</span>
                        {statDef && (
                          <BungieImage
                            className={styles.icon}
                            src={statDef.displayProperties.icon}
                          />
                        )}
                        <span>{label}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {(farmCount > 0 || plan.shortfall > 0) && keepItems.length > 0 && (
                  <div className={styles.keep}>
                    {t('LoadoutBuilder.FarmingPlannerKeep')}
                    <div className={styles.keepItems}>
                      {keepItems.map((item) => (
                        <DraggableInventoryItem item={item} key={item.id}>
                          <ItemPopupTrigger item={item}>
                            {(ref, onClick) => (
                              <ConnectedInventoryItem item={item} onClick={onClick} ref={ref} />
                            )}
                          </ItemPopupTrigger>
                        </DraggableInventoryItem>
                      ))}
                    </div>
                  </div>
                )}
                {plan.exoticMissing && (
                  <div className={styles.keep}>
                    {t('LoadoutBuilder.FarmingPlannerExoticMissing')}
                  </div>
                )}
                {plan.anyExoticMissing && (
                  <div className={styles.keep}>
                    {t('LoadoutBuilder.FarmingPlannerAnyExoticMissing')}
                  </div>
                )}
                {plan.setBonusUnsatisfiable && (
                  <div className={styles.verdict}>
                    {t('LoadoutBuilder.FarmingPlannerSetImpossible')}
                  </div>
                )}
              </>
            )}
            <div className={styles.fineprint}>
              {keepOwned
                ? t('LoadoutBuilder.FarmingPlannerFinePrint', { tier: MAX_GEAR_TIER })
                : t('LoadoutBuilder.FarmingPlannerFinePrintIdeal', { tier: MAX_GEAR_TIER })}{' '}
              {!hasIgnoredStat && t('LoadoutBuilder.FarmingPlannerTuningUncredited')}
            </div>
            {/* Debug timings for evaluating the search — deliberately not localized. */}
            <div className={styles.fineprint}>
              {plan.combosExamined.toLocaleString()} combinations,{' '}
              {Math.round(planState.planTimeMs)}ms
            </div>
          </>
        )
      )}
    </CollapsibleTitle>
  );
});
