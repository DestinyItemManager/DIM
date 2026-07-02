import { SetBonusCounts } from '@destinyitemmanager/dim-api-types';
import BungieImage from 'app/dim-ui/BungieImage';
import CheckButton from 'app/dim-ui/CheckButton';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { armorStats } from 'app/search/d2-known-values';
import { memo, useDeferredValue, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { mapDimItemToProcessItems } from '../process/mappers';
import {
  ArmorBucketHashes,
  ArmorEnergyRules,
  ArmorStatHashes,
  ArmorStats,
  DesiredStatRange,
  ItemsByBucket,
  ModStatChanges,
} from '../types';
import * as styles from './HypotheticalPlanner.m.scss';
import {
  buildHypotheticalBlocks,
  deriveArmor3ArchetypeModel,
  planMinimumAcquisitions,
  PlannerOwnedPiece,
  pruneBlocksForTargets,
} from './hypothetical-items';

/** How many owned candidates to consider per slot (plus set-bonus pieces). */
const OWNED_PER_SLOT = 10;
/** How many extra set-bonus candidates to consider per slot per required set. */
const OWNED_PER_SLOT_PER_SET = 4;
/** How many hypothetical stat blocks to consider. */
const MAX_BLOCKS = 24;

/**
 * PROTOTYPE for https://github.com/DestinyItemManager/DIM/issues/11832
 *
 * Answers "what armor do I still need to farm to hit these stat targets?"
 * Keeps as many owned pieces as possible (including the locked exotic and
 * pieces contributing to required set bonuses) and fills the remaining slots
 * with ideal hypothetical tier-5 drops.
 */
export default memo(function HypotheticalPlanner({
  desiredStatRanges,
  filteredItems,
  lockedExoticHash,
  setBonuses,
  modStatChanges,
  armorEnergyRules,
  className,
}: {
  desiredStatRanges: DesiredStatRange[];
  filteredItems: ItemsByBucket;
  lockedExoticHash: number | undefined;
  setBonuses: SetBonusCounts;
  modStatChanges: ModStatChanges;
  armorEnergyRules: ArmorEnergyRules;
  className?: string;
}) {
  const defs = useD2Definitions()!;
  const allItems = useSelector(allItemsSelector);

  // Whether to build around owned armor (minimize farming) or plan the ideal
  // build from drops alone. The locked exotic is respected either way.
  const [keepOwned, setKeepOwned] = useState(true);

  // Let stat slider drags repaint before we recompute the plan.
  const deferredStatRanges = useDeferredValue(desiredStatRanges);

  const blocks = useMemo(() => {
    const model = deriveArmor3ArchetypeModel(allItems, defs);
    return model && buildHypotheticalBlocks(model);
  }, [allItems, defs]);

  const hasTargets = deferredStatRanges.some((r) => r.maxStat > 0 && r.minStat > 0);

  // The assumed stats of every filtered owned item, independent of stat targets.
  const ownedStats = useMemo(() => {
    const itemStats = (item: DimItem): ArmorStats =>
      mapDimItemToProcessItems({
        dimItem: item,
        armorEnergyRules,
        desiredStatRanges: [],
        autoStatMods: false,
      })[0].stats as ArmorStats;
    return { itemStats };
  }, [armorEnergyRules]);

  const plan = useMemo(() => {
    if (!blocks || !hasTargets) {
      return undefined;
    }
    const start = performance.now();

    const enabledStats = deferredStatRanges
      .filter((r) => r.maxStat > 0)
      .map(({ statHash }): ArmorStatHashes => statHash);
    const statTotal = (stats: ArmorStats) =>
      enabledStats.reduce((total, statHash) => total + stats[statHash], 0);

    // The locked exotic occupies its slot with the user's best owned copy.
    let exoticItem: DimItem | undefined;
    if (lockedExoticHash !== undefined && lockedExoticHash > 0) {
      for (const bucketHash of ArmorBucketHashes) {
        for (const item of filteredItems[bucketHash]) {
          if (
            item.hash === lockedExoticHash &&
            (!exoticItem ||
              statTotal(ownedStats.itemStats(item)) > statTotal(ownedStats.itemStats(exoticItem)))
          ) {
            exoticItem = item;
          }
        }
      }
    }

    const setBonusRequirements = Object.keys(setBonuses)
      .map((setHash) => ({
        setHash: Number(setHash),
        count: setBonuses[Number(setHash)] ?? 0,
      }))
      .filter((r) => r.count > 0);

    // Owned candidates per remaining slot: the best pieces overall, plus the
    // best pieces from each required set so set bonuses stay satisfiable.
    // With keepOwned off, every remaining slot is planned as an ideal drop.
    const ownedByBucket = ArmorBucketHashes.filter(
      (bucketHash) => bucketHash !== exoticItem?.bucket.hash,
    ).map((bucketHash) => {
      if (!keepOwned) {
        return [];
      }
      const candidates = filteredItems[bucketHash]
        .filter((item) => !item.isExotic)
        .map((item): PlannerOwnedPiece & { item: DimItem } => ({
          item,
          name: item.name,
          stats: ownedStats.itemStats(item),
          setBonusHash: item.setBonus?.hash,
        }))
        .sort((a, b) => statTotal(b.stats) - statTotal(a.stats));
      const kept = new Set(candidates.slice(0, OWNED_PER_SLOT));
      for (const { setHash } of setBonusRequirements) {
        for (const piece of candidates
          .filter((p) => p.setBonusHash === setHash)
          .slice(0, OWNED_PER_SLOT_PER_SET)) {
          kept.add(piece);
        }
      }
      return [...kept];
    });

    const modStatTotals = Object.fromEntries(
      armorStats.map((statHash) => [statHash, modStatChanges[statHash].value]),
    ) as ArmorStats;

    const result = planMinimumAcquisitions({
      blocks: pruneBlocksForTargets(blocks, deferredStatRanges, MAX_BLOCKS),
      desiredStatRanges: deferredStatRanges,
      modStatTotals,
      fixedPieces: exoticItem ? [ownedStats.itemStats(exoticItem)] : [],
      ownedByBucket,
      setBonusRequirements,
    });

    return { ...result, exoticItem, planTimeMs: performance.now() - start };
  }, [
    blocks,
    hasTargets,
    deferredStatRanges,
    lockedExoticHash,
    filteredItems,
    ownedStats,
    setBonuses,
    modStatChanges,
    keepOwned,
  ]);

  if (!blocks) {
    return null;
  }

  const farmCount = plan?.farm.reduce((total, { count }) => total + count, 0) ?? 0;
  const keepNames = plan
    ? [...(plan.exoticItem ? [plan.exoticItem.name] : []), ...plan.keep.map((p) => p.name)]
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
                : t('LoadoutBuilder.FarmingPlannerNeed', { count: farmCount })}
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
                    count,
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
          {farmCount > 0 && keepNames.length > 0 && (
            <div className={styles.keep}>
              {t('LoadoutBuilder.FarmingPlannerKeep', { items: keepNames.join(', ') })}
            </div>
          )}
          {plan.setBonusUnsatisfiable && (
            <div className={styles.verdict}>{t('LoadoutBuilder.FarmingPlannerSetImpossible')}</div>
          )}
          <div className={styles.fineprint}>
            {t('LoadoutBuilder.FarmingPlannerFinePrint', {
              combos: plan.combosExamined.toLocaleString(),
              time: Math.round(plan.planTimeMs),
            })}
          </div>
        </>
      )}
    </CollapsibleTitle>
  );
});
