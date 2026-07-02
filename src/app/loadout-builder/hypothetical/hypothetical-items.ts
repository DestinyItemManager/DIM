import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import { calculateAssumedMasterworkStats } from 'app/loadout-drawer/loadout-utils';
import { armorStats } from 'app/search/d2-known-values';
import { sumBy } from 'app/utils/collections';
import { getArmor3StatFocus, isArmor3 } from 'app/utils/item-utils';
import { weakMemoize } from 'app/utils/memoize';
import { getArmorArchetype } from 'app/utils/socket-utils';
import armorArchetypeStats from 'data/d2/armor-archetypes.json';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { ProcessItem } from '../process-worker/types';
import {
  ArmorEnergyRules,
  ArmorStatHashes,
  ArmorStats,
  DesiredStatRange,
  majorStatBoost,
  minorStatBoost,
  permissiveArmorEnergyRules,
} from '../types';

/**
 * PROTOTYPE for https://github.com/DestinyItemManager/DIM/issues/11832
 *
 * A "stat-target planner" needs to reason about armor the user does not own.
 * The insight that keeps this from blowing up combinatorially: the stat block
 * of a hypothetical Armor 3.0 legendary is fully determined by
 * (archetype, tertiary stat) at a given gear tier — 12 archetypes x 4
 * tertiaries = 48 stat-distinct pieces, identical across all five slots.
 *
 * DIM has no static table of archetype stat distributions, so we combine two
 * sources: archetype identities from the manifest's archetype plugs (complete,
 * covers archetypes the user has never seen — but their primary/secondary
 * stats only exist as localized description text, so the parsing here is
 * en-manifest-only) plus the user's own items (locale-independent, and the
 * source of per-tier stat values via DIM's assumed-masterwork pipeline).
 * A real implementation should generate the archetype table in d2ai instead,
 * like the other plug-set constants in loadout-builder/types.ts.
 */

export interface Armor3Archetype {
  plugHash: number;
  name: string;
  primaryStatHash: ArmorStatHashes;
  secondaryStatHash: ArmorStatHashes;
  /** Tertiary stats seen on real items of this archetype (validation aid). */
  observedTertiaries: Set<ArmorStatHashes>;
}

/**
 * Assumed-masterwork stat values for one gear tier. At the maximum tier these
 * are deterministic; at lower tiers stats roll in a small range and these are
 * the best values observed (an upper bound).
 */
export interface Armor3TierValues {
  /** The archetype's primary stat, e.g. 30 at tier 5. */
  primaryValue: number;
  /** The archetype's secondary stat, e.g. 25 at tier 5. */
  secondaryValue: number;
  /** The rolled tertiary stat, e.g. 20 at tier 5. */
  tertiaryValue: number;
  /** The three stats not part of the roll (masterwork bonus), e.g. 5. */
  baselineValue: number;
}

export interface Armor3ArchetypeModel {
  archetypes: Armor3Archetype[];
  /** Stat values by gear tier (1-5), for the tiers present in the sample. */
  valuesByTier: Map<number, Armor3TierValues>;
  /** The best gear tier observed — hypothetical blocks are built at this tier. */
  gearTier: number;
}

/** A hypothetical armor piece, i.e. one stat-distinct (archetype, tertiary) combination. */
export interface HypotheticalArmorBlock {
  /** e.g. "Gunner / tertiary 4043523819" */
  name: string;
  archetypePlugHash: number;
  archetypeName: string;
  tertiaryStatHash: ArmorStatHashes;
  stats: ArmorStats;
}

/** An ArmorStats object with every stat at 0. */
export function zeroArmorStats(): ArmorStats {
  return Object.fromEntries(armorStats.map((statHash) => [statHash, 0])) as ArmorStats;
}

/** Is this an item the planner's stat model can be derived from? */
function isModelSourceItem(item: DimItem) {
  return (
    item.bucket.inArmor &&
    item.rarity === 'Legendary' &&
    item.tier > 0 &&
    isArmor3(item) &&
    Boolean(item.stats)
  );
}

/**
 * The item's stats under the given armor energy rules (assumed masterwork),
 * untuned — the canonical stat block for planning.
 */
export function assumedMasterworkStats(
  item: DimItem,
  armorEnergyRules: ArmorEnergyRules = permissiveArmorEnergyRules,
): { [statHash: number]: number } {
  return calculateAssumedMasterworkStats(item, armorEnergyRules);
}

/**
 * All armor archetypes from the manifest. The primary/secondary stats come
 * from the generated armor-archetypes.json table (built by d2ai — the defs
 * carry no structured stat data for these plugs). Archetypes the table
 * doesn't know yet (a new season before a d2ai refresh) fall back to parsing
 * the plug description ("Primary Stat: X\nSecondary Stat: Y"), which only
 * works on an English manifest. Memoized per manifest since it scans the
 * whole InventoryItem table.
 */
export const archetypesFromManifest = weakMemoize(
  (defs: D2ManifestDefinitions): Armor3Archetype[] => {
    const archetypes: Armor3Archetype[] = [];
    const known = new Set<number>();
    for (const [plugHashStr, [primaryStatHash, secondaryStatHash]] of Object.entries(
      armorArchetypeStats,
    )) {
      const plugHash = Number(plugHashStr);
      const def = defs.InventoryItem.get(plugHash);
      if (def?.displayProperties.name) {
        known.add(plugHash);
        archetypes.push({
          plugHash,
          name: def.displayProperties.name,
          primaryStatHash,
          secondaryStatHash,
          observedTertiaries: new Set(),
        });
      }
    }

    const statHashByName = new Map(
      armorStats.map((statHash) => [defs.Stat.get(statHash)?.displayProperties.name, statHash]),
    );
    for (const def of Object.values(defs.InventoryItem.getAll())) {
      if (
        def.plug?.plugCategoryHash !== PlugCategoryHashes.ArmorArchetypes ||
        !def.displayProperties?.name ||
        known.has(def.hash)
      ) {
        continue;
      }
      const match = /Primary Stat: (.+)\nSecondary Stat: (.+)/.exec(
        def.displayProperties.description,
      );
      const primaryStatHash = match && statHashByName.get(match[1].trim());
      const secondaryStatHash = match && statHashByName.get(match[2].trim());
      if (primaryStatHash && secondaryStatHash) {
        archetypes.push({
          plugHash: def.hash,
          name: def.displayProperties.name,
          primaryStatHash,
          secondaryStatHash,
          observedTertiaries: new Set(),
        });
      }
    }
    return archetypes;
  },
);

/**
 * Derive the archetype stat model: archetype identities from the manifest
 * (authoritative where parseable) plus the user's items (fallback for
 * non-English manifests, and the source of per-tier stat values). Returns
 * undefined if the items contain no usable Armor 3.0 legendaries (we need at
 * least one to establish per-tier stat values).
 */
export function deriveArmor3ArchetypeModel(
  allItems: DimItem[],
  defs?: D2ManifestDefinitions,
): Armor3ArchetypeModel | undefined {
  const archetypes = new Map<number, Armor3Archetype>();

  // Seed from the manifest first so a single weirdly-rolled item can't
  // register a wrong primary/secondary for an archetype.
  if (defs) {
    for (const archetype of archetypesFromManifest(defs)) {
      // Fresh observedTertiaries so the memoized manifest entries stay pure.
      archetypes.set(archetype.plugHash, { ...archetype, observedTertiaries: new Set() });
    }
  }

  const valuesByTier = new Map<number, Armor3TierValues>();
  let gearTier = 0;

  for (const item of allItems) {
    if (!isModelSourceItem(item)) {
      continue;
    }
    const archetypePlug = getArmorArchetype(item);
    const focus = getArmor3StatFocus(item) as ArmorStatHashes[];
    if (!archetypePlug || focus.length !== 3) {
      continue;
    }
    const [primary, secondary, tertiary] = focus;

    // Archetype identity (which stats it boosts) doesn't depend on tier.
    let archetype = archetypes.get(archetypePlug.hash);
    if (!archetype) {
      archetype = {
        plugHash: archetypePlug.hash,
        name: archetypePlug.displayProperties.name,
        primaryStatHash: primary,
        secondaryStatHash: secondary,
        observedTertiaries: new Set(),
      };
      archetypes.set(archetypePlug.hash, archetype);
    } else if (archetype.primaryStatHash !== primary || archetype.secondaryStatHash !== secondary) {
      // Inconsistent with the manifest or previous observations — skip rather
      // than poison the model. The validation test surfaces these.
      continue;
    }
    archetype.observedTertiaries.add(tertiary);

    // Stat values scale with gear tier, so collect them per tier.
    gearTier = Math.max(gearTier, item.tier);
    let values = valuesByTier.get(item.tier);
    if (!values) {
      values = { primaryValue: 0, secondaryValue: 0, tertiaryValue: 0, baselineValue: 0 };
      valuesByTier.set(item.tier, values);
    }
    const stats = assumedMasterworkStats(item);
    values.primaryValue = Math.max(values.primaryValue, stats[primary]);
    values.secondaryValue = Math.max(values.secondaryValue, stats[secondary]);
    values.tertiaryValue = Math.max(values.tertiaryValue, stats[tertiary]);
    for (const statHash of armorStats) {
      if (statHash !== primary && statHash !== secondary && statHash !== tertiary) {
        values.baselineValue = Math.max(values.baselineValue, stats[statHash]);
      }
    }
  }

  // Without at least one real item we have no stat values to build blocks from.
  if (!gearTier) {
    return undefined;
  }

  return { archetypes: [...archetypes.values()], valuesByTier, gearTier };
}

/**
 * The stat block the model predicts for a piece with this archetype and
 * tertiary stat at the given gear tier.
 */
export function predictStats(
  model: Armor3ArchetypeModel,
  archetype: Armor3Archetype,
  tertiaryStatHash: ArmorStatHashes,
  tier: number,
): ArmorStats | undefined {
  const values = model.valuesByTier.get(tier);
  if (!values) {
    return undefined;
  }
  return Object.fromEntries(
    armorStats.map((statHash) => [
      statHash,
      statHash === archetype.primaryStatHash
        ? values.primaryValue
        : statHash === archetype.secondaryStatHash
          ? values.secondaryValue
          : statHash === tertiaryStatHash
            ? values.tertiaryValue
            : values.baselineValue,
    ]),
  ) as ArmorStats;
}

/**
 * Enumerate every stat-distinct hypothetical armor piece at the best observed
 * gear tier: each archetype with each possible tertiary stat (any armor stat
 * not already primary/secondary).
 */
export function buildHypotheticalBlocks(model: Armor3ArchetypeModel): HypotheticalArmorBlock[] {
  const blocks: HypotheticalArmorBlock[] = [];
  for (const archetype of model.archetypes) {
    for (const tertiaryStatHash of armorStats) {
      if (
        tertiaryStatHash === archetype.primaryStatHash ||
        tertiaryStatHash === archetype.secondaryStatHash
      ) {
        continue;
      }
      blocks.push({
        name: `${archetype.name} / tertiary ${tertiaryStatHash}`,
        archetypePlugHash: archetype.plugHash,
        archetypeName: archetype.name,
        tertiaryStatHash,
        stats: predictStats(model, archetype, tertiaryStatHash, model.gearTier)!,
      });
    }
  }
  return blocks;
}

/**
 * Turn a hypothetical block into a ProcessItem the existing LO worker can
 * consume unmodified. Fully masterworked, non-exotic, no set bonus.
 */
export function hypotheticalProcessItem(
  block: HypotheticalArmorBlock,
  idSuffix: string,
): ProcessItem {
  return {
    id: `hypothetical|${block.archetypeName}|${block.tertiaryStatHash}|${idSuffix}`,
    name: block.name,
    isExotic: false,
    isArtifice: false,
    remainingEnergyCapacity: 10,
    power: 10,
    stats: { ...block.stats },
  };
}

/**
 * Keep the blocks most relevant to the targeted stats, to bound search size.
 *
 * Every block at a given tier has the same multiset of stat values (just on
 * different stats), so a straight relevance sort ties and would arbitrarily
 * drop whole archetypes. Instead: within each archetype, drop all but one
 * block whose tertiary lands on an ignored stat (they're interchangeable),
 * order the rest targeted-tertiary-first, and select round-robin across
 * archetypes so every archetype stays represented.
 */
export function pruneBlocksForTargets(
  blocks: HypotheticalArmorBlock[],
  desiredStatRanges: DesiredStatRange[],
  limit: number,
): HypotheticalArmorBlock[] {
  if (blocks.length <= limit) {
    return blocks;
  }
  const targeted = desiredStatRanges
    .filter((r) => r.maxStat > 0 && r.minStat > 0)
    .map(({ statHash }): ArmorStatHashes => statHash);
  const ignored = new Set(
    desiredStatRanges.filter((r) => r.maxStat === 0).map(({ statHash }) => statHash),
  );

  // Group by archetype, preserving block order within each group.
  const groups = new Map<number, HypotheticalArmorBlock[]>();
  for (const block of blocks) {
    const group = groups.get(block.archetypePlugHash);
    if (group) {
      group.push(block);
    } else {
      groups.set(block.archetypePlugHash, [block]);
    }
  }

  const rank = (block: HypotheticalArmorBlock) => {
    const idx = targeted.indexOf(block.tertiaryStatHash);
    return idx >= 0 ? idx : targeted.length;
  };
  for (const [plugHash, group] of groups) {
    // Blocks whose tertiary is on an ignored stat are interchangeable — keep one.
    let keptIgnored = false;
    const deduped = group.filter((block) => {
      if (!ignored.has(block.tertiaryStatHash)) {
        return true;
      }
      if (keptIgnored) {
        return false;
      }
      keptIgnored = true;
      return true;
    });
    deduped.sort((a, b) => rank(a) - rank(b));
    groups.set(plugHash, deduped);
  }

  // Round-robin: the best block of each archetype, then the second-best, etc.
  const result: HypotheticalArmorBlock[] = [];
  for (let i = 0; result.length < limit; i++) {
    let added = false;
    for (const group of groups.values()) {
      if (i < group.length) {
        result.push(group[i]);
        added = true;
        if (result.length >= limit) {
          break;
        }
      }
    }
    if (!added) {
      break;
    }
  }
  return result;
}

/** Energy costs of the +10/+5 general stat mods for each stat. */
export type PlannerAutoModCosts = {
  [statHash in ArmorStatHashes]?: { major: number; minor: number };
};

/** Optional energy-aware mod modeling inputs. Without them, mods are free. */
export interface PlannerModOptions {
  /** Energy costs of the auto stat mods per stat. */
  autoModCosts?: PlannerAutoModCosts;
  /** Energy costs of user-locked general mods (they occupy sockets and energy). */
  lockedGeneralModCosts?: number[];
  /** Remaining energy of every piece in the set (fixed pieces + planned slots). */
  energyBudgets?: number[];
}

/** Precomputed per-plan-call mod data, in enabled-stat order. */
interface ModContext {
  /** General sockets available for auto stat mods. */
  numAutoMods: number;
  majorCosts: number[];
  minorCosts: number[];
  /** Locked general mods' costs, descending — they claim pieces before auto mods. */
  lockedCosts: number[];
  /** The largest cost that might need to fit on a piece. */
  maxCost: number;
}

function buildModContext(
  numAutoMods: number,
  statOrder: ArmorStatHashes[],
  autoModCosts?: PlannerAutoModCosts,
  lockedGeneralModCosts?: number[],
): ModContext {
  const majorCosts = statOrder.map((statHash) => autoModCosts?.[statHash]?.major ?? 0);
  const minorCosts = statOrder.map((statHash) => autoModCosts?.[statHash]?.minor ?? 0);
  const lockedCosts = [...(lockedGeneralModCosts ?? [])].sort((a, b) => b - a);
  const maxCost = Math.max(0, ...majorCosts, ...minorCosts, ...lockedCosts);
  return { numAutoMods, majorCosts, minorCosts, lockedCosts, maxCost };
}

/**
 * Reserve pieces for the user's locked general mods (each piece has one
 * general socket) and return the energy budgets left for auto mods, sorted
 * descending. Each locked mod takes the smallest budget that fits it, keeping
 * the big budgets available for auto mods. A locked mod nothing fits consumes
 * the smallest budget anyway — the planner errs on the optimistic side.
 */
function budgetsAfterLockedMods(budgets: number[], ctx: ModContext): number[] {
  const remaining = [...budgets].sort((a, b) => b - a);
  for (const cost of ctx.lockedCosts) {
    if (!remaining.length) {
      break;
    }
    let pick = remaining.length - 1;
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (remaining[i] >= cost) {
        pick = i;
        break;
      }
    }
    remaining.copyWithin(pick, pick + 1);
    remaining.length--;
  }
  return remaining;
}

/**
 * Greedily spend up to ctx.numAutoMods general stat mods (+10 major or +5
 * minor) on the largest remaining needs. When `budgets` is given (descending,
 * after locked general mods), every mod must fit the energy of some remaining
 * piece; without it mods are unconstrained. Mutates `needed`, `majors`,
 * `minors` and `budgets`; returns the remaining shortfall.
 */
function applyGreedyMods(
  needed: number[],
  majors: number[],
  minors: number[],
  shortfall: number,
  ctx: ModContext,
  budgets?: number[],
): number {
  for (let socket = 0; socket < ctx.numAutoMods && shortfall > 0; socket++) {
    if (budgets?.length === 0) {
      break;
    }
    let bestStat = -1;
    let bestReduction = 0;
    let bestCost = 0;
    let bestIsMajor = true;
    for (let s = 0; s < needed.length; s++) {
      const need = needed[s];
      if (need === 0) {
        continue;
      }
      let reduction = need > majorStatBoost ? majorStatBoost : need;
      let cost = ctx.majorCosts[s];
      let isMajor = true;
      // An equal-reduction minor is strictly better when it's cheaper.
      if (need <= minorStatBoost && ctx.minorCosts[s] <= cost) {
        cost = ctx.minorCosts[s];
        isMajor = false;
      }
      // budgets[0] is the largest remaining budget — the mod fits iff it fits there.
      if (budgets && budgets[0] < cost) {
        // The preferred mod doesn't fit anywhere; fall back to the minor.
        if (isMajor && budgets[0] >= ctx.minorCosts[s]) {
          reduction = need > minorStatBoost ? minorStatBoost : need;
          cost = ctx.minorCosts[s];
          isMajor = false;
        } else {
          continue;
        }
      }
      if (reduction > bestReduction || (reduction === bestReduction && cost < bestCost)) {
        bestStat = s;
        bestReduction = reduction;
        bestCost = cost;
        bestIsMajor = isMajor;
      }
    }
    if (bestStat < 0) {
      break;
    }
    needed[bestStat] -= bestReduction;
    shortfall -= bestReduction;
    if (bestIsMajor) {
      majors[bestStat]++;
    } else {
      minors[bestStat]++;
    }
    if (budgets) {
      // Consume the smallest budget that fits, allocation-free.
      let pick = budgets.length - 1;
      while (budgets[pick] < bestCost) {
        pick--;
      }
      budgets.copyWithin(pick, pick + 1);
      budgets.length--;
    }
  }
  return shortfall;
}

/** Collapse a list of block indices into {block, count} entries. */
function tallyBlocks(indices: number[], blocks: HypotheticalArmorBlock[]) {
  const countsByIndex = new Map<number, number>();
  for (const idx of indices) {
    countsByIndex.set(idx, (countsByIndex.get(idx) ?? 0) + 1);
  }
  return [...countsByIndex.entries()].map(([idx, count]) => ({ block: blocks[idx], count }));
}

/** Spread per-enabled-stat mod counts back into a full ArmorStats object. */
function modsToArmorStats(mods: number[], statOrder: ArmorStatHashes[]): ArmorStats {
  const result = zeroArmorStats();
  for (let s = 0; s < statOrder.length; s++) {
    result[statOrder[s]] = mods[s];
  }
  return result;
}

export interface HypotheticalPlan {
  /** Total stat points short of the target after armor + stat mods. 0 = reachable. */
  shortfall: number;
  /** The recommended composition: how many pieces of each block to farm. */
  counts: { block: HypotheticalArmorBlock; count: number }[];
  /** Stat totals from the armor alone. */
  armorTotals: ArmorStats;
  /** Number of +10 general stat mods assigned per stat. */
  modsPerStat: ArmorStats;
  /** Number of +5 general stat mods assigned per stat. */
  minorModsPerStat: ArmorStats;
  /** How many 5-piece compositions were examined. */
  combosExamined: number;
}

/**
 * Find the 5-piece composition of hypothetical blocks that best satisfies the
 * stat targets, allowing for auto stat mods on top. `baseStats` (mods,
 * subclass, a locked exotic) are added to every composition; when set, the
 * composition covers 5 - (pieces included in baseStats) slots via numSlots.
 *
 * Because hypothetical pieces are slot-interchangeable, sets are multisets:
 * we enumerate index combinations i0 <= i1 <= ... <= i4, which is C(n+4, 5)
 * combinations instead of n^5 — for n=48 that's ~2.6M instead of ~255M.
 *
 * Simplifications vs. the real worker (fine for a feasibility prototype):
 * set bonuses and tuning mods are ignored; stat mods are up to numGeneralMods
 * majors (+10) or minors (+5) assigned greedily, respecting per-piece energy
 * budgets when modOptions provides them.
 */
export function planBestComposition(
  blocks: HypotheticalArmorBlock[],
  desiredStatRanges: DesiredStatRange[],
  numGeneralMods = 5,
  baseStats?: ArmorStats,
  numSlots = 5,
  modOptions?: PlannerModOptions,
): HypotheticalPlan {
  const n = blocks.length;
  // Ignored stats (max 0) are clamped to 0 and can't contribute to the score
  // or the shortfall, so skip them entirely in the hot loop.
  const enabledRanges = desiredStatRanges.filter((r) => r.maxStat > 0);
  const numStats = enabledRanges.length;
  const statOrder = enabledRanges.map(({ statHash }): ArmorStatHashes => statHash);
  const minStats = enabledRanges.map((r) => r.minStat);
  const maxStats = enabledRanges.map((r) => r.maxStat);
  // Per-block stat arrays in enabled-stat order, for tight inner loops.
  const blockStats = blocks.map((block) => statOrder.map((statHash) => block.stats[statHash]));
  const base = statOrder.map((statHash) => baseStats?.[statHash] ?? 0);

  const ctx = buildModContext(
    numGeneralMods,
    statOrder,
    modOptions?.autoModCosts,
    modOptions?.lockedGeneralModCosts,
  );
  // Energy budgets only matter when some cost exceeds some piece's budget;
  // otherwise every mod fits everywhere and we can skip the bookkeeping.
  const energyBudgets = modOptions?.energyBudgets;
  const autoBudgets =
    energyBudgets && ctx.maxCost > Math.min(...energyBudgets)
      ? budgetsAfterLockedMods(energyBudgets, ctx)
      : undefined;
  const budgetScratch = autoBudgets ? new Array<number>(autoBudgets.length) : undefined;

  let combosExamined = 0;
  let bestShortfall = Number.MAX_SAFE_INTEGER;
  let bestScore = -1;
  let bestIndices: number[] | undefined;
  let bestMajors: number[] | undefined;
  let bestMinors: number[] | undefined;

  // Partial sums hoisted out of the inner loops, plus scratch arrays, all
  // reused across iterations to avoid allocation. partials[d] holds the sum of
  // base + the first d chosen blocks.
  const partials = Array.from({ length: numSlots }, () => new Array<number>(numStats));
  const needed = new Array<number>(numStats);
  const majors = new Array<number>(numStats);
  const minors = new Array<number>(numStats);
  const indices = new Array<number>(numSlots);

  const evaluate = (prev: number[], lastIdx: number) => {
    combosExamined++;
    const last = blockStats[lastIdx];
    let shortfall = 0;
    let score = 0;
    for (let s = 0; s < numStats; s++) {
      const value = Math.min(prev[s] + last[s], maxStats[s]);
      const need = minStats[s] - value;
      needed[s] = need > 0 ? need : 0;
      shortfall += needed[s];
      score += value;
      majors[s] = 0;
      minors[s] = 0;
    }
    if (shortfall > 0) {
      let budgets: number[] | undefined;
      if (autoBudgets && budgetScratch) {
        budgetScratch.length = autoBudgets.length;
        for (let i = 0; i < autoBudgets.length; i++) {
          budgetScratch[i] = autoBudgets[i];
        }
        budgets = budgetScratch;
      }
      shortfall = applyGreedyMods(needed, majors, minors, shortfall, ctx, budgets);
    }
    if (shortfall < bestShortfall || (shortfall === bestShortfall && score > bestScore)) {
      bestShortfall = shortfall;
      bestScore = score;
      bestIndices = indices.slice();
      bestMajors = majors.slice();
      bestMinors = minors.slice();
    }
  };

  // Enumerate non-decreasing index tuples of length numSlots. `prev` holds
  // base + the blocks chosen at shallower depths.
  const enumerate = (depth: number, start: number) => {
    const prev = depth === 0 ? base : partials[depth - 1];
    for (let i = start; i < n; i++) {
      indices[depth] = i;
      if (depth === numSlots - 1) {
        evaluate(prev, i);
      } else {
        const partial = partials[depth];
        const stats = blockStats[i];
        for (let s = 0; s < numStats; s++) {
          partial[s] = prev[s] + stats[s];
        }
        enumerate(depth + 1, i);
      }
    }
  };
  if (numSlots > 0 && n > 0 && numStats > 0) {
    enumerate(0, 0);
  }

  if (!bestIndices || !bestMajors || !bestMinors) {
    // No blocks or no enabled stats — nothing to plan.
    return {
      shortfall: 0,
      counts: [],
      armorTotals: zeroArmorStats(),
      modsPerStat: zeroArmorStats(),
      minorModsPerStat: zeroArmorStats(),
      combosExamined,
    };
  }

  const counts = tallyBlocks(bestIndices, blocks);
  const armorTotals = zeroArmorStats();
  for (const { block, count } of counts) {
    for (const statHash of armorStats) {
      armorTotals[statHash] += block.stats[statHash] * count;
    }
  }

  return {
    shortfall: bestShortfall,
    counts,
    armorTotals,
    modsPerStat: modsToArmorStats(bestMajors, statOrder),
    minorModsPerStat: modsToArmorStats(bestMinors, statOrder),
    combosExamined,
  };
}

/** An owned armor piece the acquisition planner may keep in the build. */
export interface PlannerOwnedPiece {
  /** Display name of the owned item. */
  name: string;
  stats: ArmorStats;
  /** The set bonus this piece contributes to, if any. */
  setBonusHash?: number;
  /** Energy left for stat mods (after locked bucket-specific mods). Default 10. */
  energy?: number;
}

export interface SetBonusRequirement {
  setHash: number;
  count: number;
}

export interface AcquisitionPlan<T extends PlannerOwnedPiece = PlannerOwnedPiece> {
  /** Stat points still missing at the best solution; 0 = targets reachable. */
  shortfall: number;
  /** Hypothetical pieces to farm. */
  farm: { block: HypotheticalArmorBlock; count: number }[];
  /** Owned pieces to keep alongside the farmed pieces. */
  keep: T[];
  /** How many of the farmed pieces must come from each required set. */
  farmFromSets: { setHash: number; count: number }[];
  /** True if the set bonus requirements can't be satisfied at all. */
  setBonusUnsatisfiable: boolean;
  /** Number of +10 general stat mods assigned per stat. */
  modsPerStat: ArmorStats;
  /** Number of +5 general stat mods assigned per stat. */
  minorModsPerStat: ArmorStats;
  /** How many combinations were examined. */
  combosExamined: number;
}

/**
 * Find the smallest number of new (hypothetical, ideal-drop) armor pieces that
 * completes the user's stat targets, keeping as many owned pieces as possible.
 *
 * The search first computes the ideal-drops-everywhere answer over the full
 * block list as an exact bound: if even that falls short, keeping owned
 * (weaker) pieces can't help, so we return the ideal composition as the
 * "closest" result without the expensive owned search. Otherwise, for each
 * farm-count m (ascending), we try every choice of which slots keep owned
 * armor, every combination of owned candidates in those slots, and every
 * multiset of m hypothetical blocks (pruned to searchBlockLimit) for the rest,
 * returning at the first m with a feasible solution. Set bonus requirements
 * count owned pieces of the set plus farmed pieces (all archetypes drop from
 * all sources, so a farmed piece can always come from the required set).
 *
 * Same simplifications as planBestComposition: tuning mods are ignored; stat
 * mods are up to `numGeneralMods` majors (+10) or minors (+5) assigned
 * greedily, respecting per-piece energy when the energy inputs are provided.
 */
export function planMinimumAcquisitions<T extends PlannerOwnedPiece>({
  blocks,
  desiredStatRanges,
  modStatTotals,
  fixedPieces = [],
  ownedByBucket = [],
  requiredSlots = [],
  setBonusRequirements = [],
  numGeneralMods = 5,
  searchBlockLimit = 24,
  autoModCosts,
  lockedGeneralModCosts,
  fixedPieceEnergies,
  farmedEnergyBySlot,
}: {
  blocks: HypotheticalArmorBlock[];
  desiredStatRanges: DesiredStatRange[];
  /** Stat contributions (mods, subclass) that apply regardless of armor. */
  modStatTotals?: ArmorStats;
  /** Stat blocks of pieces locked into the build (e.g. the chosen exotic). */
  fixedPieces?: ArmorStats[];
  /** Owned candidate pieces for each remaining slot. Length = slots to fill. */
  ownedByBucket?: T[][];
  /** Indices into ownedByBucket that must keep an owned piece (pinned items). */
  requiredSlots?: number[];
  setBonusRequirements?: SetBonusRequirement[];
  numGeneralMods?: number;
  /** Cap on blocks considered in the owned search (multisets are materialized). */
  searchBlockLimit?: number;
  /** Energy costs of the auto stat mods; without this, mods are assumed free. */
  autoModCosts?: PlannerAutoModCosts;
  /** Energy costs of user-locked general mods. */
  lockedGeneralModCosts?: number[];
  /** Energy left for stat mods on each fixed piece (parallel to fixedPieces). Default 10. */
  fixedPieceEnergies?: number[];
  /** Energy a farmed piece would have in each slot (10 minus that slot's locked mod costs). */
  farmedEnergyBySlot?: number[];
}): AcquisitionPlan<T> {
  const enabledRanges = desiredStatRanges.filter((r) => r.maxStat > 0);
  const numStats = enabledRanges.length;
  const statOrder = enabledRanges.map(({ statHash }): ArmorStatHashes => statHash);
  const minStats = enabledRanges.map((r) => r.minStat);
  const maxStats = enabledRanges.map((r) => r.maxStat);
  const numSlots = ownedByBucket.length;

  const baseTotals = zeroArmorStats();
  for (const statHash of armorStats) {
    baseTotals[statHash] =
      (modStatTotals?.[statHash] ?? 0) + sumBy(fixedPieces, (piece) => piece[statHash]);
  }

  const reqSetHashes = setBonusRequirements.map((r) => r.setHash);
  const reqSetCounts = setBonusRequirements.map((r) => r.count);
  const reqSetTotal = sumBy(setBonusRequirements, (r) => r.count);

  // Energy left for stat mods per piece (10 = a masterworked piece with no
  // other mods; matches hypotheticalProcessItem).
  const fixedEnergies = fixedPieces.map((_, i) => fixedPieceEnergies?.[i] ?? 10);
  const farmedEnergies = ownedByBucket.map((_, i) => farmedEnergyBySlot?.[i] ?? 10);
  const ctx = buildModContext(numGeneralMods, statOrder, autoModCosts, lockedGeneralModCosts);
  // Energy budgets only bind when some mod cost exceeds some piece's budget.
  let minBudget = Math.min(...fixedEnergies, ...farmedEnergies);
  for (const list of ownedByBucket) {
    for (const piece of list) {
      minBudget = Math.min(minBudget, piece.energy ?? 10);
    }
  }
  const constrained = ctx.maxCost > minBudget;

  // Exact ideal bound over the FULL block list, which doubles as the answer
  // when no owned candidates are provided (ideal mode) or when the targets
  // are unreachable even with perfect drops everywhere.
  const bound = planBestComposition(
    blocks,
    desiredStatRanges,
    numGeneralMods,
    baseTotals,
    numSlots,
    {
      autoModCosts,
      lockedGeneralModCosts,
      energyBudgets: [...fixedEnergies, ...farmedEnergies],
    },
  );
  const boundAsPlan = (): AcquisitionPlan<T> => ({
    shortfall: bound.shortfall,
    farm: bound.counts,
    keep: [],
    farmFromSets: setBonusRequirements
      .map((r) => ({ setHash: r.setHash, count: Math.min(r.count, numSlots) }))
      .filter((r) => r.count > 0),
    setBonusUnsatisfiable: reqSetTotal > numSlots,
    modsPerStat: bound.modsPerStat,
    minorModsPerStat: bound.minorModsPerStat,
    combosExamined: bound.combosExamined,
  });

  const anyOwned = ownedByBucket.some((list) => list.length > 0);
  if (bound.shortfall > 0 || !anyOwned || numStats === 0) {
    return boundAsPlan();
  }

  // The owned search materializes multiset sums, so bound the block list.
  const searchBlocks = pruneBlocksForTargets(blocks, desiredStatRanges, searchBlockLimit);

  const base = statOrder.map((statHash) => baseTotals[statHash]);
  const ownedVecs = ownedByBucket.map((list) =>
    list.map((piece) => ({
      piece,
      stats: statOrder.map((statHash) => piece.stats[statHash]),
      energy: piece.energy ?? 10,
    })),
  );
  // Component-wise best owned stats per bucket, for upper-bound pruning.
  const bestOwnedVec = ownedVecs.map((candidates) => {
    const best = new Array<number>(numStats).fill(0);
    for (const { stats } of candidates) {
      for (let s = 0; s < numStats; s++) {
        best[s] = Math.max(best[s], stats[s]);
      }
    }
    return best;
  });
  const blockVecs = searchBlocks.map((block) => statOrder.map((statHash) => block.stats[statHash]));

  // Stat sums for every multiset of search blocks, built lazily per size.
  interface MultisetEntry {
    sum: number[];
    indices: number[];
  }
  const multisetsBySize: MultisetEntry[][] = [
    [{ sum: new Array<number>(numStats).fill(0), indices: [] }],
  ];
  // Component-wise max across each level's sums, for upper-bound pruning.
  const maxMultisetSum: number[][] = [new Array<number>(numStats).fill(0)];
  const ensureMultisets = (m: number) => {
    while (multisetsBySize.length <= m) {
      const entries: MultisetEntry[] = [];
      const maxSum = new Array<number>(numStats).fill(0);
      for (const entry of multisetsBySize[multisetsBySize.length - 1]) {
        const minIdx = entry.indices.length ? entry.indices[entry.indices.length - 1] : 0;
        for (let i = minIdx; i < blockVecs.length; i++) {
          const sum = entry.sum.map((v, s) => v + blockVecs[i][s]);
          for (let s = 0; s < numStats; s++) {
            maxSum[s] = Math.max(maxSum[s], sum[s]);
          }
          entries.push({ sum, indices: [...entry.indices, i] });
        }
      }
      multisetsBySize.push(entries);
      maxMultisetSum.push(maxSum);
    }
  };

  let combosExamined = bound.combosExamined;
  let setBonusUnsatisfiable = false;
  interface Best {
    shortfall: number;
    score: number;
    m: number;
    keptOwned: { bucket: number; index: number }[];
    multisetIndices: number[];
    majors: number[];
    minors: number[];
    setDeficits: number[];
  }
  let best: Best | undefined;

  const needed = new Array<number>(numStats);
  const majors = new Array<number>(numStats);
  const minors = new Array<number>(numStats);
  const chosen: { bucket: number; index: number }[] = [];
  // Per-depth scratch arrays so the recursion allocates nothing per node.
  const partialStack = Array.from({ length: numSlots + 1 }, () => new Array<number>(numStats));
  const setCountsStack = Array.from(
    { length: numSlots + 1 },
    () => new Array<number>(reqSetHashes.length),
  );
  // Energy budgets for the composition being evaluated (constrained mode only):
  // set up once per leaf of the owned recursion, copied per evaluate since
  // applyGreedyMods consumes them.
  let leafAutoBudgets: number[] | undefined;
  const budgetScratch: number[] = [];

  const evaluate = (partial: number[], multiset: MultisetEntry, m: number, deficits: number[]) => {
    combosExamined++;
    let shortfall = 0;
    let score = 0;
    for (let s = 0; s < numStats; s++) {
      const value = Math.min(partial[s] + multiset.sum[s], maxStats[s]);
      const need = minStats[s] - value;
      needed[s] = need > 0 ? need : 0;
      shortfall += needed[s];
      score += value;
      majors[s] = 0;
      minors[s] = 0;
    }
    if (shortfall > 0) {
      let budgets: number[] | undefined;
      if (leafAutoBudgets) {
        budgetScratch.length = leafAutoBudgets.length;
        for (let i = 0; i < leafAutoBudgets.length; i++) {
          budgetScratch[i] = leafAutoBudgets[i];
        }
        budgets = budgetScratch;
      }
      shortfall = applyGreedyMods(needed, majors, minors, shortfall, ctx, budgets);
    }
    let better = false;
    if (!best) {
      better = true;
    } else if (shortfall < best.shortfall) {
      better = true;
    } else if (shortfall === best.shortfall) {
      better = m < best.m || (m === best.m && score > best.score);
    }
    if (better) {
      best = {
        shortfall,
        score,
        m,
        keptOwned: chosen.slice(),
        multisetIndices: multiset.indices,
        majors: majors.slice(),
        minors: minors.slice(),
        setDeficits: deficits.slice(),
      };
    }
  };

  /** Would this subset's best case (best owned per slot + best multiset) even reach the targets? */
  const subsetUpperBoundFeasible = (keepSlots: number[], m: number) => {
    let shortfall = 0;
    const maxSum = maxMultisetSum[m];
    for (let s = 0; s < numStats; s++) {
      let value = base[s] + maxSum[s];
      for (const bucket of keepSlots) {
        value += bestOwnedVec[bucket][s];
      }
      const need = minStats[s] - Math.min(value, maxStats[s]);
      needed[s] = need > 0 ? need : 0;
      shortfall += needed[s];
      majors[s] = 0;
      minors[s] = 0;
    }
    // Deliberately unconstrained by energy — this must stay an upper bound.
    return shortfall <= 0 || applyGreedyMods(needed, majors, minors, shortfall, ctx) <= 0;
  };

  const required = new Set(requiredSlots);
  const maxM = numSlots - required.size;

  for (let m = 0; m <= maxM; m++) {
    ensureMultisets(m);
    const multisets = multisetsBySize[m];
    for (const keepSlots of kSubsets(numSlots, numSlots - m)) {
      if (
        keepSlots.some((bucket) => ownedVecs[bucket].length === 0) ||
        ![...required].every((r) => keepSlots.includes(r)) ||
        !subsetUpperBoundFeasible(keepSlots, m)
      ) {
        continue;
      }
      for (let s = 0; s < numStats; s++) {
        partialStack[0][s] = base[s];
      }
      setCountsStack[0].fill(0);
      // Energy budgets of the farmed pieces: the slots this subset doesn't keep.
      const farmSlotEnergies = constrained
        ? farmedEnergies.filter((_, slot) => !keepSlots.includes(slot))
        : undefined;
      const recur = (depth: number) => {
        const partial = partialStack[depth];
        const setCounts = setCountsStack[depth];
        if (depth === keepSlots.length) {
          let deficitTotal = 0;
          const deficits = reqSetCounts.map((count, i) => {
            const deficit = Math.max(0, count - setCounts[i]);
            deficitTotal += deficit;
            return deficit;
          });
          if (deficitTotal > m) {
            // Not enough farmed pieces to cover the set bonus. At the last
            // possible m, degrade gracefully rather than returning nothing.
            if (m < maxM) {
              return;
            }
            setBonusUnsatisfiable = true;
          }
          leafAutoBudgets = farmSlotEnergies
            ? budgetsAfterLockedMods(
                [
                  ...fixedEnergies,
                  ...chosen.map(({ bucket, index }) => ownedVecs[bucket][index].energy),
                  ...farmSlotEnergies,
                ],
                ctx,
              )
            : undefined;
          for (const multiset of multisets) {
            evaluate(partial, multiset, m, deficits);
          }
          return;
        }
        const bucket = keepSlots[depth];
        const candidates = ownedVecs[bucket];
        const nextPartial = partialStack[depth + 1];
        const nextSetCounts = setCountsStack[depth + 1];
        for (let i = 0; i < candidates.length; i++) {
          const owned = candidates[i];
          for (let s = 0; s < numStats; s++) {
            nextPartial[s] = partial[s] + owned.stats[s];
          }
          const setBonusHash = owned.piece.setBonusHash;
          for (let r = 0; r < reqSetHashes.length; r++) {
            nextSetCounts[r] =
              setCounts[r] +
              (setBonusHash !== undefined && reqSetHashes[r] === setBonusHash ? 1 : 0);
          }
          chosen.push({ bucket, index: i });
          recur(depth + 1);
          chosen.pop();
        }
      };
      recur(0);
    }
    if (best?.shortfall === 0 && best.m === m) {
      break;
    }
  }

  // The pruned owned search can miss compositions the full-block bound found;
  // if it came up short while the ideal bound is feasible, fall back to the
  // ideal answer rather than reporting a false shortfall.
  if (!best || best.shortfall > 0) {
    return boundAsPlan();
  }

  const result = best;
  return {
    shortfall: result.shortfall,
    farm: tallyBlocks(result.multisetIndices, searchBlocks),
    keep: result.keptOwned.map(({ bucket, index }) => ownedVecs[bucket][index].piece),
    farmFromSets: setBonusRequirements
      .map((r, i) => ({ setHash: r.setHash, count: result.setDeficits[i] }))
      .filter((r) => r.count > 0),
    setBonusUnsatisfiable,
    modsPerStat: modsToArmorStats(result.majors, statOrder),
    minorModsPerStat: modsToArmorStats(result.minors, statOrder),
    combosExamined,
  };
}

/** All k-element subsets of [0, n), each in ascending order. */
function kSubsets(n: number, k: number): number[][] {
  const results: number[][] = [];
  const current: number[] = [];
  const recur = (start: number) => {
    if (current.length === k) {
      results.push(current.slice());
      return;
    }
    for (let i = start; i <= n - (k - current.length); i++) {
      current.push(i);
      recur(i + 1);
      current.pop();
    }
  };
  recur(0);
  return results;
}
