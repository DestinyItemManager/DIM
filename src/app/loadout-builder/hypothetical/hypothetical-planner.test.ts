import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import { armorStats } from 'app/search/d2-known-values';
import { getArmor3StatFocus } from 'app/utils/item-utils';
import { infoLog } from 'app/utils/log';
import { getArmorArchetype } from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { StatHashes } from 'data/d2/generated-enums';
import { getTestDefinitions, getTestStores } from 'testing/test-utils';
import { process as runLoProcess } from '../process-worker/process';
import { ProcessItemsByBucket } from '../process-worker/types';
import { getAutoMods, mapAutoMods, mapDimItemToProcessItems } from '../process/mappers';
import {
  ArmorBucketHashes,
  ArmorStatHashes,
  ArmorStats,
  DesiredStatRange,
  permissiveArmorEnergyRules,
} from '../types';
import {
  Armor3ArchetypeModel,
  assumedMasterworkStats,
  buildHypotheticalBlocks,
  deriveArmor3ArchetypeModel,
  HypotheticalArmorBlock,
  hypotheticalProcessItem,
  planBestComposition,
  predictStats,
} from './hypothetical-items';

/**
 * Feasibility prototype for https://github.com/DestinyItemManager/DIM/issues/11832
 * (a stat-target planner that suggests what armor to farm).
 *
 * These tests derive the hypothetical-armor stat model from the real test
 * profile, validate it against every owned item, and benchmark both a
 * dedicated multiset enumerator and the unmodified LO worker over the
 * hypothetical item space. The console output is the deliverable.
 */

jest.setTimeout(600_000);

/** The example target from the issue: 160 Grenade / 100 Super, plus some Weapons. */
const EXAMPLE_TARGETS: { [statHash: number]: number } = {
  [StatHashes.Grenade]: 160,
  [StatHashes.Super]: 100,
  [StatHashes.Weapons]: 60,
};

function makeDesiredStatRanges(targets: { [statHash: number]: number }): DesiredStatRange[] {
  return armorStats.map((statHash) => ({
    statHash,
    minStat: targets[statHash] ?? 0,
    maxStat: 200,
  }));
}

const zeroStats = () => Object.fromEntries(armorStats.map((h) => [h, 0])) as ArmorStats;

describe('stat-target planner prototype (#11832)', () => {
  let defs: D2ManifestDefinitions;
  let allItems: DimItem[];
  let model: Armor3ArchetypeModel;
  let blocks: HypotheticalArmorBlock[];
  let desiredStatRanges: DesiredStatRange[];

  const statName = (statHash: number) =>
    defs.Stat.get(statHash)?.displayProperties.name ?? `${statHash}`;

  const describeBlock = (block: HypotheticalArmorBlock) =>
    `${block.archetypeName} (tertiary: ${statName(block.tertiaryStatHash)})`;

  const describeStats = (stats: ArmorStats) =>
    armorStats.map((h) => `${statName(h)} ${stats[h]}`).join(', ');

  beforeAll(async () => {
    const [defsResult, stores] = await Promise.all([getTestDefinitions(), getTestStores()]);
    defs = defsResult;
    allItems = stores.flatMap((s) => s.items);
    model = deriveArmor3ArchetypeModel(allItems)!;
    expect(model).toBeDefined();
    blocks = buildHypotheticalBlocks(model);
    desiredStatRanges = makeDesiredStatRanges(EXAMPLE_TARGETS);
  });

  it('derives the archetype stat grid from real armor', () => {
    for (const [tier, values] of [...model.valuesByTier.entries()].sort(([a], [b]) => a - b)) {
      infoLog(
        'planner prototype',
        `tier ${tier} values: primary ${values.primaryValue}, secondary ${values.secondaryValue}, tertiary ${values.tertiaryValue}, baseline ${values.baselineValue}`,
      );
    }
    for (const archetype of model.archetypes) {
      infoLog(
        'planner prototype',
        `  ${archetype.name}: ${statName(archetype.primaryStatHash)} / ${statName(
          archetype.secondaryStatHash,
        )}, observed tertiaries: ${[...archetype.observedTertiaries].map(statName).join(', ')}`,
      );
    }
    infoLog(
      'planner prototype',
      `hypothetical space: ${blocks.length} stat-distinct pieces per slot`,
    );

    expect(model.archetypes.length).toBeGreaterThanOrEqual(2);
    const bestValues = model.valuesByTier.get(model.gearTier)!;
    expect(bestValues.primaryValue).toBeGreaterThan(bestValues.secondaryValue);
    expect(bestValues.secondaryValue).toBeGreaterThan(bestValues.tertiaryValue);
    expect(bestValues.tertiaryValue).toBeGreaterThan(bestValues.baselineValue);
    expect(bestValues.baselineValue).toBeGreaterThan(0);
  });

  it('predicts the stats of every owned armor 3.0 legendary at its own tier', () => {
    // Empirical finding: only the maximum gear tier is deterministic. At lower
    // tiers stats roll in a small range below the tier's best value, so the
    // model's per-tier values are an upper bound there. The planner only ever
    // builds hypothetical pieces at the max tier, where prediction is exact.
    let checked = 0;
    let exactAtBestTier = 0;
    const violations: string[] = [];
    for (const item of allItems) {
      if (!item.bucket.inArmor || item.rarity !== 'Legendary' || item.tier <= 0 || !item.stats) {
        continue;
      }
      const archetypePlug = getArmorArchetype(item);
      const focus = getArmor3StatFocus(item);
      if (!archetypePlug || focus.length !== 3) {
        continue;
      }
      const archetype = model.archetypes.find((a) => a.plugHash === archetypePlug.hash);
      const predicted =
        archetype && predictStats(model, archetype, focus[2] as ArmorStatHashes, item.tier);
      if (!predicted) {
        violations.push(`${item.name}: no model entry for ${archetypePlug.displayProperties.name}`);
        continue;
      }
      checked++;
      const actual = assumedMasterworkStats(item);
      let exact = true;
      for (const statHash of armorStats) {
        if (actual[statHash] > predicted[statHash]) {
          violations.push(
            `${item.name} (tier ${item.tier} ${archetypePlug.displayProperties.name}): ` +
              `${statName(statHash)} predicted at most ${predicted[statHash]}, actual ${actual[statHash]}`,
          );
        }
        exact &&= actual[statHash] === predicted[statHash];
      }
      if (item.tier === model.gearTier) {
        if (!exact) {
          violations.push(`${item.name}: not an exact match at the best tier`);
        } else {
          exactAtBestTier++;
        }
      }
    }
    infoLog(
      'planner prototype',
      `validated ${checked} owned armor 3.0 legendaries; ` +
        `${exactAtBestTier} tier-${model.gearTier} items matched the grid exactly`,
    );
    expect(checked).toBeGreaterThan(0);
    expect(exactAtBestTier).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });

  it('plans the ideal composition over the abstract space (multiset enumerator)', () => {
    const start = performance.now();
    const plan = planBestComposition(blocks, desiredStatRanges);
    const ms = performance.now() - start;

    infoLog(
      'planner prototype',
      `multiset enumerator: ${plan.combosExamined} compositions in ${ms.toFixed(1)}ms`,
    );
    infoLog('planner prototype', `  shortfall: ${plan.shortfall} (0 = target reachable)`);
    for (const { block, count } of plan.counts) {
      infoLog('planner prototype', `  ${count}x ${describeBlock(block)}`);
    }
    infoLog('planner prototype', `  armor totals: ${describeStats(plan.armorTotals)}`);
    infoLog('planner prototype', `  +10 mods: ${describeStats(plan.modsPerStat)}`);

    expect(ms).toBeLessThan(5000);
    // 160 grenade / 100 super / 60 weapons should be reachable with ideal drops
    expect(plan.shortfall).toBe(0);

    // And an impossible target should be detected as impossible, with the gap quantified.
    const impossible = makeDesiredStatRanges(Object.fromEntries(armorStats.map((h) => [h, 200])));
    const impossiblePlan = planBestComposition(blocks, impossible);
    infoLog(
      'planner prototype',
      `impossible-target shortfall: ${impossiblePlan.shortfall} stat points`,
    );
    expect(impossiblePlan.shortfall).toBeGreaterThan(0);
  });

  it('runs the full hypothetical space through the unmodified LO worker', async () => {
    const autoModOptions = mapAutoMods(getAutoMods(defs, new Set()));
    const filteredItems = Object.fromEntries(
      ArmorBucketHashes.map((bucketHash) => [
        bucketHash,
        blocks.map((block) => hypotheticalProcessItem(block, `${bucketHash}`)),
      ]),
    ) as ProcessItemsByBucket;

    const start = performance.now();
    const result = await runLoProcess(
      0,
      {
        filteredItems,
        modStatTotals: zeroStats(),
        lockedMods: { generalMods: [], activityMods: [] },
        setBonuses: {},
        requiredPerks: [],
        desiredStatRanges,
        anyExotic: false,
        autoModOptions,
        autoStatMods: true,
        strictUpgrades: false,
        stopOnFirstSet: false,
      },
      () => {
        /* progress not needed */
      },
    );
    const ms = performance.now() - start;

    infoLog(
      'planner prototype',
      `LO worker over hypothetical space: ${result.combos} combos in ${ms.toFixed(0)}ms ` +
        `(${Math.round((result.combos / ms) * 1000)} combos/s), ` +
        `${result.processInfo.numValidSets} valid sets`,
    );
    expect(result.sets.length).toBeGreaterThan(0);

    const best = result.sets[0];
    const recipe = best.armor.map((id) => {
      const block = blocks.find((b) =>
        id.startsWith(`hypothetical|${b.archetypeName}|${b.tertiaryStatHash}|`),
      );
      return block ? describeBlock(block) : id;
    });
    infoLog('planner prototype', `  best set: ${recipe.join(' + ')}`);
    infoLog('planner prototype', `  best set stats: ${describeStats(best.stats)}`);
  });

  it('diffs the target against the best the user can actually build', async () => {
    // Pick the class with the most Armor 3.0 legendaries in the profile.
    const armor3Legendaries = allItems.filter(
      (i) =>
        i.bucket.inArmor &&
        i.rarity === 'Legendary' &&
        i.tier > 0 &&
        i.classType !== DestinyClass.Unknown &&
        i.stats,
    );
    const byClass = Object.groupBy(armor3Legendaries, (i) => i.classType);
    const [classType, classItems] = Object.entries(byClass).sort(
      ([, a], [, b]) => b.length - a.length,
    )[0];
    infoLog(
      'planner prototype',
      `diffing with ${classItems.length} owned armor 3.0 legendaries (class ${classType})`,
    );

    // Crude stand-in for LO's real item filtering: top 20 per slot by stat total.
    // The real feature would reuse filterItems/useProcess.
    const filteredItems = Object.fromEntries(
      ArmorBucketHashes.map((bucketHash) => {
        const processItems = classItems
          .filter((i) => i.bucket.hash === bucketHash)
          .map(
            (dimItem) =>
              mapDimItemToProcessItems({
                dimItem,
                armorEnergyRules: permissiveArmorEnergyRules,
                desiredStatRanges,
                autoStatMods: false,
              })[0],
          );
        processItems.sort(
          (a, b) =>
            armorStats.reduce((acc, h) => acc + b.stats[h], 0) -
            armorStats.reduce((acc, h) => acc + a.stats[h], 0),
        );
        return [bucketHash, processItems.slice(0, 20)];
      }),
    ) as ProcessItemsByBucket;

    const autoModOptions = mapAutoMods(getAutoMods(defs, new Set()));
    const start = performance.now();
    const result = await runLoProcess(
      0,
      {
        filteredItems,
        modStatTotals: zeroStats(),
        lockedMods: { generalMods: [], activityMods: [] },
        setBonuses: {},
        requiredPerks: [],
        desiredStatRanges,
        anyExotic: false,
        autoModOptions,
        autoStatMods: true,
        strictUpgrades: false,
        stopOnFirstSet: false,
      },
      () => {
        /* progress not needed */
      },
    );
    const ms = performance.now() - start;
    infoLog(
      'planner prototype',
      `LO worker over owned armor: ${result.combos} combos in ${ms.toFixed(0)}ms, ` +
        `${result.processInfo.numValidSets} sets meeting the target`,
    );

    const plan = planBestComposition(blocks, desiredStatRanges);
    if (result.sets.length) {
      infoLog(
        'planner prototype',
        `  best owned set stats: ${describeStats(result.sets[0].stats)}`,
      );
    } else {
      infoLog('planner prototype', '  target NOT reachable with owned armor');
    }
    const verdictSuffix = plan.shortfall ? ` (short ${plan.shortfall} points)` : '';
    infoLog(
      'planner prototype',
      `  planner verdict: target ${plan.shortfall === 0 ? 'IS' : 'is NOT'} reachable with ideal drops${verdictSuffix}`,
    );
    for (const { block, count } of plan.counts) {
      infoLog('planner prototype', `  farm ${count}x ${describeBlock(block)}`);
    }
    expect(result.combos).toBeGreaterThan(0);
  });
});
