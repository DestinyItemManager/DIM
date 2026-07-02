import { SetBonusCounts } from '@destinyitemmanager/dim-api-types';
import BungieImage from 'app/dim-ui/BungieImage';
import CheckButton from 'app/dim-ui/CheckButton';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { armorStats } from 'app/search/d2-known-values';
import { mapValues } from 'app/utils/collections';
import { compareBy, reverseComparator } from 'app/utils/comparators';
import { getArmor3StatFocus } from 'app/utils/item-utils';
import { getArmorArchetype } from 'app/utils/socket-utils';
import { memo, useCallback, useDeferredValue, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { allItemsSelector } from '../../inventory/selectors';
import {
  ArmorBucketHashes,
  ArmorEnergyRules,
  ArmorStatHashes,
  ArmorStats,
  DesiredStatRange,
  ItemsByBucket,
  ModStatChanges,
  PinnedItems,
} from '../types';
import * as styles from './HypotheticalPlanner.m.scss';
import {
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
  numLockedGeneralMods,
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
  numLockedGeneralMods: number;
  className?: string;
}) {
  const defs = useD2Definitions()!;
  const allItems = useSelector(allItemsSelector);

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
      ArmorBucketHashes.map((bucketHash) =>
        filteredItems[bucketHash]
          // Guard against stat-less (e.g. classified) items poisoning sums with NaN
          .filter((item) => item.stats?.length)
          .map((item): MappedItem => ({
            item,
            isExotic: item.isExotic,
            name: describeItem(item),
            stats: assumedMasterworkStats(item, armorEnergyRules) as ArmorStats,
            setBonusHash: item.setBonus?.hash,
          })),
      ),
    [filteredItems, armorEnergyRules, describeItem],
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

    // The locked exotic occupies its slot with the user's best owned copy.
    // filterItems already restricted the exotic's bucket to matching copies
    // (by hash or name), so any exotic there is the locked one.
    const exoticDef =
      lockedExoticHash !== undefined && lockedExoticHash > 0
        ? defs.InventoryItem.get(lockedExoticHash)
        : undefined;
    const exoticBucketHash = exoticDef?.inventory?.bucketTypeHash;
    let exoticEntry: MappedItem | undefined;
    if (exoticBucketHash !== undefined) {
      const bucketIdx = ArmorBucketHashes.indexOf(exoticBucketHash);
      if (bucketIdx >= 0) {
        for (const entry of mappedByBucket[bucketIdx]) {
          if (
            entry.isExotic &&
            (!exoticEntry || statTotal(entry.stats) > statTotal(exoticEntry.stats))
          ) {
            exoticEntry = entry;
          }
        }
      }
    }
    // The user locked an exotic they have no available copy of — its slot must
    // be farmed (approximated by an ideal legendary block) and we say so.
    const exoticMissing = exoticBucketHash !== undefined && !exoticEntry;

    const setBonusRequirements: SetBonusRequirement[] = Object.keys(setBonuses)
      .map((setHash) => ({
        setHash: Number(setHash),
        count: setBonuses[Number(setHash)] ?? 0,
      }))
      .filter((r) => r.count > 0);

    // Owned candidates per remaining slot: pinned items are locked in; else
    // the best pieces overall plus the best pieces from each required set so
    // set bonuses stay satisfiable. With keepOwned off, unpinned slots are
    // planned as ideal drops.
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
      if (!keepOwned || (exoticMissing && bucketHash === exoticBucketHash)) {
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

    const modStatTotals = mapValues(modStatChanges, (stat) => stat.value);

    // Mirror the worker: auto stat mods use the general sockets not taken by
    // user-locked general mods, and none at all when the toggle is off.
    const numGeneralMods = autoStatMods ? Math.max(0, 5 - numLockedGeneralMods) : 0;

    const result = planMinimumAcquisitions({
      blocks: modelAndBlocks.blocks,
      desiredStatRanges: deferredStatRanges,
      modStatTotals,
      fixedPieces: exoticEntry ? [exoticEntry.stats] : [],
      ownedByBucket,
      requiredSlots,
      setBonusRequirements,
      numGeneralMods,
      searchBlockLimit: MAX_BLOCKS,
    });

    return {
      ...result,
      exoticItem: exoticEntry?.item,
      exoticMissing,
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
    numLockedGeneralMods,
    keepOwned,
  ]);

  if (!modelAndBlocks) {
    return null;
  }

  const farmCount = plan?.farm.reduce((total, { count }) => total + count, 0) ?? 0;
  const keepNames = plan
    ? [...(plan.exoticItem ? [describeItem(plan.exoticItem)] : []), ...plan.keep.map((p) => p.name)]
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
          {armorStats.some((statHash) => plan.modsPerStat[statHash] > 0) && (
            <ul className={styles.recipe}>
              {armorStats.map((statHash) => {
                const numMods = plan.modsPerStat[statHash];
                if (!numMods) {
                  return null;
                }
                const statDef = defs.Stat.get(statHash);
                return (
                  <li key={statHash}>
                    <span className={styles.count}>{numMods}×</span>
                    {statDef && (
                      <BungieImage className={styles.icon} src={statDef.displayProperties.icon} />
                    )}
                    <span>
                      {t('LoadoutBuilder.FarmingPlannerMod', {
                        stat: statDef?.displayProperties.name ?? statHash,
                      })}
                    </span>
                  </li>
                );
              })}
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
