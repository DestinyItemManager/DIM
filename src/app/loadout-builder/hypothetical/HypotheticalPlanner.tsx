import { SetBonusCounts } from '@destinyitemmanager/dim-api-types';
import BungieImage from 'app/dim-ui/BungieImage';
import CheckButton from 'app/dim-ui/CheckButton';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { calculateAssumedItemEnergy } from 'app/loadout/armor-upgrade-utils';
import { ModMap } from 'app/loadout/mod-assignment-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { armorStats } from 'app/search/d2-known-values';
import { mapValues, sumBy } from 'app/utils/collections';
import { compareBy, reverseComparator } from 'app/utils/comparators';
import { getArmor3StatFocus } from 'app/utils/item-utils';
import { getArmorArchetype } from 'app/utils/socket-utils';
import { memo, useCallback, useDeferredValue, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { allItemsSelector } from '../../inventory/selectors';
import { useAutoMods } from '../process/useProcess';
import {
  ArmorBucketHashes,
  ArmorEnergyRules,
  ArmorStatHashes,
  ArmorStats,
  DesiredStatRange,
  ItemsByBucket,
  LOCKED_EXOTIC_ANY_EXOTIC,
  ModStatChanges,
  PinnedItems,
} from '../types';
import * as styles from './HypotheticalPlanner.m.scss';
import {
  AcquisitionPlan,
  assumedMasterworkStats,
  buildHypotheticalBlocks,
  deriveArmor3ArchetypeModel,
  planMinimumAcquisitions,
  PlannerOwnedPiece,
  SetBonusRequirement,
} from './hypothetical-items';

/** How many owned candidates to consider per slot (plus set-bonus pieces). */
const OWNED_PER_SLOT = 10;
/** How many extra set-bonus candidates to consider per slot per required set. */
const OWNED_PER_SLOT_PER_SET = 4;
/** How many hypothetical stat blocks the owned search considers. */
const MAX_BLOCKS = 24;
/** Energy capacity of a masterworked piece. */
const MAX_ENERGY = 10;

const modEnergyCost = (mod: PluggableInventoryItemDefinition) =>
  mod.plug.energyCost?.energyCost ?? 0;

interface MappedItem extends PlannerOwnedPiece {
  item: DimItem;
  isExotic: boolean;
}

/**
 * PROTOTYPE for https://github.com/DestinyItemManager/DIM/issues/11832
 *
 * Answers "what armor do I still need to farm to hit these stat targets?"
 * Keeps as many owned pieces as possible (the locked exotic, pinned items,
 * and pieces contributing to required set bonuses included) and fills the
 * remaining slots with ideal hypothetical drops.
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
  className?: string;
}) {
  const defs = useD2Definitions()!;
  const allItems = useSelector(allItemsSelector);
  const autoModDefs = useAutoMods(storeId);

  // Whether to build around owned armor (minimize farming) or plan the ideal
  // build from drops alone. The locked exotic and pins are respected either way.
  const [keepOwned, setKeepOwned] = useState(true);

  // Let stat slider drags repaint before we recompute the plan.
  const deferredStatRanges = useDeferredValue(desiredStatRanges);

  const modelAndBlocks = useMemo(() => {
    const model = deriveArmor3ArchetypeModel(allItems, defs);
    return model && { model, blocks: buildHypotheticalBlocks(model) };
  }, [allItems, defs]);

  const hasTargets = deferredStatRanges.some((r) => r.maxStat > 0 && r.minStat > 0);

  // What the +10/+5 general mods cost per stat.
  const autoModCosts = useMemo(
    () =>
      mapValues(autoModDefs.generalMods, (mods) =>
        mods
          ? {
              major: mods.majorMod.plug.energyCost?.energyCost ?? 0,
              minor: mods.minorMod.plug.energyCost?.energyCost ?? 0,
            }
          : undefined,
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

  // Assumed stats etc. for every filtered item, computed once per inventory
  // change rather than per stat-slider change.
  const mappedByBucket = useMemo(
    () =>
      ArmorBucketHashes.map((bucketHash, bucketIdx) =>
        filteredItems[bucketHash]
          // Guard against stat-less (e.g. classified) items poisoning sums with NaN
          .filter((item) => item.stats?.length)
          .map((item): MappedItem => ({
            item,
            isExotic: item.isExotic,
            name: describeItem(item),
            stats: assumedMasterworkStats(item, armorEnergyRules) as ArmorStats,
            setBonusHash: item.setBonus?.hash,
            energy:
              calculateAssumedItemEnergy(item, armorEnergyRules) - bucketSpecificCosts[bucketIdx],
          })),
      ),
    [filteredItems, armorEnergyRules, describeItem, bucketSpecificCosts],
  );

  const plan = useMemo(() => {
    if (!modelAndBlocks || !hasTargets) {
      return undefined;
    }
    const start = performance.now();

    const enabledStats = deferredStatRanges
      .filter((r) => r.maxStat > 0)
      .map(({ statHash }): ArmorStatHashes => statHash);
    const statTotal = (stats: ArmorStats) =>
      enabledStats.reduce((total, statHash) => total + stats[statHash], 0);

    const setBonusRequirements: SetBonusRequirement[] = Object.keys(setBonuses)
      .map((setHash) => ({
        setHash: Number(setHash),
        count: setBonuses[Number(setHash)] ?? 0,
      }))
      .filter((r) => r.count > 0);

    const modStatTotals = mapValues(modStatChanges, (stat) => stat.value);
    const lockedGeneralModCosts = lockedModMap.generalMods.map(modEnergyCost);
    // Mirror the worker: auto stat mods use the general sockets not taken by
    // user-locked general mods, and none at all when the toggle is off.
    const numGeneralMods = autoStatMods ? Math.max(0, 5 - lockedModMap.generalMods.length) : 0;

    // Run one acquisition plan with the given exotic (or none) locked into its
    // slot. Owned candidates per remaining slot: pinned items are locked in;
    // else the best pieces overall plus the best pieces from each required set
    // so set bonuses stay satisfiable. With keepOwned off, unpinned slots are
    // planned as ideal drops.
    const planWithExotic = (
      exoticEntry: MappedItem | undefined,
      exoticBucketHash: number | undefined,
    ): AcquisitionPlan => {
      const remainingBucketHashes = ArmorBucketHashes.filter(
        (bucketHash) => !(exoticEntry && bucketHash === exoticBucketHash),
      );
      const requiredSlots: number[] = [];
      const ownedByBucket = remainingBucketHashes.map((bucketHash, slotIndex) => {
        const entries = mappedByBucket[ArmorBucketHashes.indexOf(bucketHash)];
        const pinned = pinnedItems[bucketHash];
        if (pinned) {
          const pinnedEntry = entries.find((e) => e.item.id === pinned.id);
          if (pinnedEntry) {
            requiredSlots.push(slotIndex);
            return [pinnedEntry];
          }
          return [];
        }
        if (!keepOwned || (!exoticEntry && bucketHash === exoticBucketHash)) {
          return [];
        }
        const scored = entries
          .filter((entry) => !entry.isExotic)
          .map((entry) => ({ entry, total: statTotal(entry.stats) }));
        scored.sort(reverseComparator(compareBy((s) => s.total)));
        const kept = new Set(scored.slice(0, OWNED_PER_SLOT).map((s) => s.entry));
        for (const { setHash } of setBonusRequirements) {
          for (const { entry } of scored
            .filter((s) => s.entry.setBonusHash === setHash)
            .slice(0, OWNED_PER_SLOT_PER_SET)) {
            kept.add(entry);
          }
        }
        return [...kept];
      });
      const farmedEnergyBySlot = remainingBucketHashes.map(
        (bucketHash) => MAX_ENERGY - bucketSpecificCosts[ArmorBucketHashes.indexOf(bucketHash)],
      );

      return planMinimumAcquisitions({
        blocks: modelAndBlocks.blocks,
        desiredStatRanges: deferredStatRanges,
        modStatTotals,
        fixedPieces: exoticEntry ? [exoticEntry.stats] : [],
        ownedByBucket,
        requiredSlots,
        setBonusRequirements,
        numGeneralMods,
        searchBlockLimit: MAX_BLOCKS,
        autoModCosts,
        lockedGeneralModCosts,
        fixedPieceEnergies: exoticEntry ? [exoticEntry.energy ?? MAX_ENERGY] : [],
        farmedEnergyBySlot,
      });
    };

    const farmCount = (p: AcquisitionPlan) => sumBy(p.farm, ({ count }) => count);
    const bestExoticIn = (bucketIdx: number) => {
      let best: MappedItem | undefined;
      for (const entry of mappedByBucket[bucketIdx]) {
        if (entry.isExotic && (!best || statTotal(entry.stats) > statTotal(best.stats))) {
          best = entry;
        }
      }
      return best;
    };

    let result: AcquisitionPlan;
    let exoticItem: DimItem | undefined;
    let exoticMissing = false;
    let anyExoticMissing = false;
    let combosTotal = 0;

    if (lockedExoticHash === LOCKED_EXOTIC_ANY_EXOTIC) {
      // "Any Exotic": the set must include one exotic. Try each slot with the
      // user's best owned exotic there and take the best outcome. A pinned
      // exotic decides the slot; a pinned legendary rules its slot out.
      const pinnedExoticBucket = ArmorBucketHashes.findIndex((bucketHash) =>
        Boolean(pinnedItems[bucketHash]?.isExotic),
      );
      const candidates: { entry: MappedItem; bucketIdx: number }[] = [];
      for (let bucketIdx = 0; bucketIdx < ArmorBucketHashes.length; bucketIdx++) {
        if (pinnedExoticBucket >= 0 && bucketIdx !== pinnedExoticBucket) {
          continue;
        }
        const pinned = pinnedItems[ArmorBucketHashes[bucketIdx]];
        if (pinned && !pinned.isExotic) {
          continue;
        }
        const entry = pinned
          ? mappedByBucket[bucketIdx].find((e) => e.item.id === pinned.id)
          : bestExoticIn(bucketIdx);
        if (entry) {
          candidates.push({ entry, bucketIdx });
        }
      }
      let best: { plan: AcquisitionPlan; entry: MappedItem } | undefined;
      for (const { entry, bucketIdx } of candidates) {
        const candidatePlan = planWithExotic(entry, ArmorBucketHashes[bucketIdx]);
        combosTotal += candidatePlan.combosExamined;
        if (
          !best ||
          candidatePlan.shortfall < best.plan.shortfall ||
          (candidatePlan.shortfall === best.plan.shortfall &&
            farmCount(candidatePlan) < farmCount(best.plan))
        ) {
          best = { plan: candidatePlan, entry };
        }
      }
      if (best) {
        result = best.plan;
        exoticItem = best.entry.item;
      } else {
        // No owned exotic anywhere — plan ideal drops and say one must be exotic.
        result = planWithExotic(undefined, undefined);
        combosTotal += result.combosExamined;
        anyExoticMissing = true;
      }
    } else {
      // The locked exotic occupies its slot with the user's best owned copy.
      // filterItems already restricted the exotic's bucket to matching copies
      // (by hash or name), so any exotic there is the locked one.
      const exoticDef =
        lockedExoticHash !== undefined && lockedExoticHash > 0
          ? defs.InventoryItem.get(lockedExoticHash)
          : undefined;
      const exoticBucketHash = exoticDef?.inventory?.bucketTypeHash;
      const bucketIdx =
        exoticBucketHash !== undefined ? ArmorBucketHashes.indexOf(exoticBucketHash) : -1;
      const exoticEntry = bucketIdx >= 0 ? bestExoticIn(bucketIdx) : undefined;
      // The user locked an exotic they have no available copy of — its slot
      // must be farmed (approximated by an ideal legendary block) and we say so.
      exoticMissing = exoticBucketHash !== undefined && !exoticEntry;
      result = planWithExotic(exoticEntry, exoticBucketHash);
      combosTotal += result.combosExamined;
      exoticItem = exoticEntry?.item;
    }

    return {
      ...result,
      combosExamined: combosTotal,
      exoticItem,
      exoticMissing,
      anyExoticMissing,
      planTimeMs: performance.now() - start,
    };
  }, [
    modelAndBlocks,
    hasTargets,
    deferredStatRanges,
    lockedExoticHash,
    defs,
    mappedByBucket,
    pinnedItems,
    setBonuses,
    modStatChanges,
    autoStatMods,
    autoModCosts,
    lockedModMap,
    bucketSpecificCosts,
    keepOwned,
  ]);

  if (!modelAndBlocks) {
    return null;
  }

  const farmCount = plan?.farm.reduce((total, { count }) => total + count, 0) ?? 0;
  const keepNames = plan
    ? [...(plan.exoticItem ? [describeItem(plan.exoticItem)] : []), ...plan.keep.map((p) => p.name)]
    : [];

  const modLines = plan
    ? armorStats.flatMap((statHash) => {
        const statDef = defs.Stat.get(statHash);
        const lines: { key: string; numMods: number; label: string }[] = [];
        if (plan.modsPerStat[statHash] > 0) {
          lines.push({
            key: `${statHash}-major`,
            numMods: plan.modsPerStat[statHash],
            label: t('LoadoutBuilder.FarmingPlannerMod', {
              stat: statDef?.displayProperties.name ?? statHash,
            }),
          });
        }
        if (plan.minorModsPerStat[statHash] > 0) {
          lines.push({
            key: `${statHash}-minor`,
            numMods: plan.minorModsPerStat[statHash],
            label: t('LoadoutBuilder.FarmingPlannerModMinor', {
              stat: statDef?.displayProperties.name ?? statHash,
            }),
          });
        }
        return lines.map((line) => ({ ...line, statDef }));
      })
    : [];

  return (
    <CollapsibleTitle
      title={t('LoadoutBuilder.FarmingPlanner')}
      sectionId="lo-farming-planner"
      className={className}
    >
      <CheckButton name="lo-farming-planner-keep-owned" checked={keepOwned} onChange={setKeepOwned}>
        {t('LoadoutBuilder.FarmingPlannerKeepOwned')}
      </CheckButton>
      {!hasTargets || !plan ? (
        <div className={styles.fineprint}>{t('LoadoutBuilder.FarmingPlannerNoTargets')}</div>
      ) : (
        <>
          <div className={styles.verdict}>
            {plan.shortfall > 0
              ? t('LoadoutBuilder.FarmingPlannerUnreachable', { points: plan.shortfall })
              : farmCount === 0
                ? t('LoadoutBuilder.FarmingPlannerAlreadyBuildable')
                : keepOwned
                  ? t('LoadoutBuilder.FarmingPlannerNeed', { count: farmCount })
                  : t('LoadoutBuilder.FarmingPlannerNeedIdeal', { count: farmCount })}
          </div>
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
                        <BungieImage className={styles.icon} src={statDef.displayProperties.icon} />
                      )}
                      {statDef?.displayProperties.name}
                    </span>
                  </li>
                );
              })}
              {plan.farmFromSets.map(({ setHash, count }) => (
                <li key={setHash} className={styles.setNote}>
                  {t('LoadoutBuilder.FarmingPlannerFromSet', {
                    numPieces: count,
                    set: defs.EquipableItemSet.get(setHash)?.displayProperties.name ?? setHash,
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
                    <BungieImage className={styles.icon} src={statDef.displayProperties.icon} />
                  )}
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          )}
          {(farmCount > 0 || plan.shortfall > 0) && keepNames.length > 0 && (
            <div className={styles.keep}>
              {t('LoadoutBuilder.FarmingPlannerKeep', { items: keepNames.join(', ') })}
            </div>
          )}
          {plan.exoticMissing && (
            <div className={styles.keep}>{t('LoadoutBuilder.FarmingPlannerExoticMissing')}</div>
          )}
          {plan.anyExoticMissing && (
            <div className={styles.keep}>{t('LoadoutBuilder.FarmingPlannerAnyExoticMissing')}</div>
          )}
          {plan.setBonusUnsatisfiable && (
            <div className={styles.verdict}>{t('LoadoutBuilder.FarmingPlannerSetImpossible')}</div>
          )}
          <div className={styles.fineprint}>
            {t(
              keepOwned
                ? 'LoadoutBuilder.FarmingPlannerFinePrint'
                : 'LoadoutBuilder.FarmingPlannerFinePrintIdeal',
              {
                tier: modelAndBlocks.model.gearTier,
                combos: plan.combosExamined.toLocaleString(),
                time: Math.round(plan.planTimeMs),
              },
            )}
          </div>
        </>
      )}
    </CollapsibleTitle>
  );
});
