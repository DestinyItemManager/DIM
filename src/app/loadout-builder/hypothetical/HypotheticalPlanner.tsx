import BungieImage from 'app/dim-ui/BungieImage';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { t } from 'app/i18next-t';
import { allItemsSelector } from 'app/inventory/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { armorStats } from 'app/search/d2-known-values';
import { memo, useDeferredValue, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { DesiredStatRange } from '../types';
import * as styles from './HypotheticalPlanner.m.scss';
import {
  buildHypotheticalBlocks,
  deriveArmor3ArchetypeModel,
  planBestComposition,
} from './hypothetical-items';

/**
 * PROTOTYPE for https://github.com/DestinyItemManager/DIM/issues/11832
 *
 * Shows which armor archetypes to farm in order to hit the currently
 * configured stat minimums, computed over the space of armor that *could*
 * drop rather than armor the user owns. Reachability is planned over 5
 * hypothetical tier-5 legendaries — exotics, set bonuses, and tuning mods are
 * not modeled yet.
 */
export default memo(function HypotheticalPlanner({
  desiredStatRanges,
  className,
}: {
  desiredStatRanges: DesiredStatRange[];
  className?: string;
}) {
  const defs = useD2Definitions()!;
  const allItems = useSelector(allItemsSelector);

  // Let stat slider drags repaint before we recompute the plan.
  const deferredStatRanges = useDeferredValue(desiredStatRanges);

  const blocks = useMemo(() => {
    const model = deriveArmor3ArchetypeModel(allItems, defs);
    return model && buildHypotheticalBlocks(model);
  }, [allItems, defs]);

  const hasTargets = deferredStatRanges.some((r) => r.maxStat > 0 && r.minStat > 0);

  const plan = useMemo(() => {
    if (!blocks || !hasTargets) {
      return undefined;
    }
    const start = performance.now();
    const result = planBestComposition(blocks, deferredStatRanges);
    return { ...result, planTimeMs: performance.now() - start };
  }, [blocks, deferredStatRanges, hasTargets]);

  if (!blocks) {
    return null;
  }

  return (
    <CollapsibleTitle
      title={t('LoadoutBuilder.FarmingPlanner')}
      sectionId="lo-farming-planner"
      className={className}
    >
      {!hasTargets || !plan ? (
        <div className={styles.fineprint}>{t('LoadoutBuilder.FarmingPlannerNoTargets')}</div>
      ) : (
        <>
          <div className={styles.verdict}>
            {plan.shortfall === 0
              ? t('LoadoutBuilder.FarmingPlannerReachable')
              : t('LoadoutBuilder.FarmingPlannerUnreachable', { points: plan.shortfall })}
          </div>
          <ul className={styles.recipe}>
            {plan.counts.map(({ block, count }) => {
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
