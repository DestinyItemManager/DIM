import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import { armorStats } from 'app/search/d2-known-values';
import { getArmor3StatFocus, isArmor3 } from 'app/utils/item-utils';
import { getArmorArchetype } from 'app/utils/socket-utils';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { ProcessItem } from '../process-worker/types';
import { mapDimItemToProcessItems } from '../process/mappers';
import {
  ArmorStatHashes,
  ArmorStats,
  DesiredStatRange,
  majorStatBoost,
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
  /** e.g. "Gunner / Super" */
  name: string;
  archetypePlugHash: number;
  archetypeName: string;
  tertiaryStatHash: ArmorStatHashes;
  stats: ArmorStats;
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

/** The item's stats under LO's most permissive rules (assume masterworked), untuned. */
export function assumedMasterworkStats(item: DimItem): { [statHash: number]: number } {
  return mapDimItemToProcessItems({
    dimItem: item,
    armorEnergyRules: permissiveArmorEnergyRules,
    desiredStatRanges: [],
    // No tuning-mod variants — we want the canonical untuned block.
    autoStatMods: false,
  })[0].stats;
}

/**
 * All armor archetypes from the manifest, with primary/secondary stats parsed
 * from the plug description ("Primary Stat: X\nSecondary Stat: Y"). The defs
 * carry no structured stat data for these plugs, so this only works on an
 * English manifest — good enough for a prototype; production would ship a
 * d2ai-generated table instead.
 */
export function archetypesFromManifest(defs: D2ManifestDefinitions): Armor3Archetype[] {
  const statHashByName = new Map(
    armorStats.map((statHash) => [defs.Stat.get(statHash)?.displayProperties.name, statHash]),
  );
  const archetypes: Armor3Archetype[] = [];
  for (const def of Object.values(defs.InventoryItem.getAll())) {
    if (
      def.plug?.plugCategoryHash !== PlugCategoryHashes.ArmorArchetypes ||
      !def.displayProperties?.name
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
}

/**
 * Derive the archetype stat model from real items, optionally merging in
 * manifest archetypes the user doesn't own any of. Returns undefined if the
 * items contain no usable Armor 3.0 legendaries (we need at least one to
 * establish per-tier stat values).
 */
export function deriveArmor3ArchetypeModel(
  allItems: DimItem[],
  defs?: D2ManifestDefinitions,
): Armor3ArchetypeModel | undefined {
  const archetypes = new Map<number, Armor3Archetype>();
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
      // Inconsistent with previous observations of this archetype — skip
      // rather than poison the model. The validation test surfaces these.
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

  if (!archetypes.size) {
    return undefined;
  }

  // Merge in archetypes from the manifest that the user owns no items of —
  // "what to farm" must cover armor the user has never seen.
  if (defs) {
    for (const archetype of archetypesFromManifest(defs)) {
      if (!archetypes.has(archetype.plugHash)) {
        archetypes.set(archetype.plugHash, archetype);
      }
    }
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

/** Keep the blocks most relevant to the targeted stats, to bound search size. */
export function pruneBlocksForTargets(
  blocks: HypotheticalArmorBlock[],
  desiredStatRanges: DesiredStatRange[],
  limit: number,
): HypotheticalArmorBlock[] {
  const targeted = desiredStatRanges
    .filter((r) => r.maxStat > 0 && r.minStat > 0)
    .map(({ statHash }): ArmorStatHashes => statHash);
  if (!targeted.length || blocks.length <= limit) {
    return blocks;
  }
  const relevance = (block: HypotheticalArmorBlock) =>
    targeted.reduce((total, statHash) => total + block.stats[statHash], 0);
  return [...blocks].sort((a, b) => relevance(b) - relevance(a)).slice(0, limit);
}

/** An owned armor piece the acquisition planner may keep in the build. */
export interface PlannerOwnedPiece {
  /** Display name of the owned item. */
  name: string;
  stats: ArmorStats;
  /** The set bonus this piece contributes to, if any. */
  setBonusHash?: number;
}

export interface SetBonusRequirement {
  setHash: number;
  count: number;
}

export interface AcquisitionPlan {
  /** Stat points still missing at the best solution; 0 = targets reachable. */
  shortfall: number;
  /** Hypothetical pieces to farm. */
  farm: { block: HypotheticalArmorBlock; count: number }[];
  /** Owned pieces to keep alongside the farmed pieces. */
  keep: PlannerOwnedPiece[];
  /** How many of the farmed pieces must come from each required set. */
  farmFromSets: { setHash: number; count: number }[];
  /** True if the set bonus requirements can't be satisfied at all. */
  setBonusUnsatisfiable: boolean;
  /** Number of +10 general stat mods assigned per stat. */
  modsPerStat: ArmorStats;
  /** How many combinations were examined. */
  combosExamined: number;
}

/**
 * Find the smallest number of new (hypothetical, ideal-drop) armor pieces that
 * completes the user's stat targets, keeping as many owned pieces as possible.
 *
 * For each farm-count m (ascending), we try every choice of which slots keep
 * owned armor, every combination of owned candidates in those slots, and every
 * multiset of m hypothetical blocks for the rest, returning at the first m
 * with a feasible solution. Set bonus requirements count owned pieces of the
 * set plus farmed pieces (all archetypes drop from all sources, so a farmed
 * piece can always come from the required set).
 *
 * Same simplifications as planBestComposition: tuning mods and mod energy are
 * ignored; stat mods are up to `numGeneralMods` majors (+10) assigned greedily.
 */
export function planMinimumAcquisitions({
  blocks,
  desiredStatRanges,
  modStatTotals,
  fixedPieces = [],
  ownedByBucket = [],
  setBonusRequirements = [],
  numGeneralMods = 5,
}: {
  blocks: HypotheticalArmorBlock[];
  desiredStatRanges: DesiredStatRange[];
  /** Stat contributions (mods, subclass) that apply regardless of armor. */
  modStatTotals?: ArmorStats;
  /** Stat blocks of pieces locked into the build (e.g. the chosen exotic). */
  fixedPieces?: ArmorStats[];
  /** Owned candidate pieces for each remaining slot. Length = slots to fill. */
  ownedByBucket?: PlannerOwnedPiece[][];
  setBonusRequirements?: SetBonusRequirement[];
  numGeneralMods?: number;
}): AcquisitionPlan {
  const enabledRanges = desiredStatRanges.filter((r) => r.maxStat > 0);
  const numStats = enabledRanges.length;
  const statOrder = enabledRanges.map(({ statHash }): ArmorStatHashes => statHash);
  const minStats = enabledRanges.map((r) => r.minStat);
  const maxStats = enabledRanges.map((r) => r.maxStat);
  const numSlots = ownedByBucket.length;

  const base = statOrder.map(
    (statHash) =>
      (modStatTotals?.[statHash] ?? 0) +
      fixedPieces.reduce((total, piece) => total + piece[statHash], 0),
  );

  const ownedVecs = ownedByBucket.map((list) =>
    list.map((piece) => ({
      piece,
      stats: statOrder.map((statHash) => piece.stats[statHash]),
    })),
  );
  const blockVecs = blocks.map((block) => statOrder.map((statHash) => block.stats[statHash]));

  // Precompute stat sums for every multiset of blocks of each size 0..numSlots.
  interface MultisetEntry {
    sum: number[];
    indices: number[];
  }
  const multisetsBySize: MultisetEntry[][] = [
    [{ sum: new Array<number>(numStats).fill(0), indices: [] }],
  ];
  for (let m = 1; m <= numSlots; m++) {
    const entries: MultisetEntry[] = [];
    for (const entry of multisetsBySize[m - 1]) {
      const minIdx = entry.indices.length ? entry.indices[entry.indices.length - 1] : 0;
      for (let i = minIdx; i < blockVecs.length; i++) {
        entries.push({
          sum: entry.sum.map((v, s) => v + blockVecs[i][s]),
          indices: [...entry.indices, i],
        });
      }
    }
    multisetsBySize.push(entries);
  }

  const reqSetHashes = setBonusRequirements.map((r) => r.setHash);
  const reqSetCounts = setBonusRequirements.map((r) => r.count);

  let combosExamined = 0;
  let setBonusUnsatisfiable = false;
  interface Best {
    shortfall: number;
    score: number;
    m: number;
    keptOwned: { bucket: number; index: number }[];
    multisetIndices: number[];
    mods: number[];
    setDeficits: number[];
  }
  let best: Best | undefined;

  const needed = new Array<number>(numStats);
  const mods = new Array<number>(numStats);

  const evaluate = (
    partial: number[],
    multiset: MultisetEntry,
    m: number,
    keptOwned: { bucket: number; index: number }[],
    setDeficits: number[],
  ) => {
    combosExamined++;
    let shortfall = 0;
    let score = 0;
    for (let s = 0; s < numStats; s++) {
      const value = Math.min(partial[s] + multiset.sum[s], maxStats[s]);
      const need = minStats[s] - value;
      needed[s] = need > 0 ? need : 0;
      shortfall += needed[s];
      score += value;
      mods[s] = 0;
    }
    if (shortfall > 0) {
      for (let i = 0; i < numGeneralMods && shortfall > 0; i++) {
        let biggest = 0;
        for (let s = 1; s < numStats; s++) {
          if (needed[s] > needed[biggest]) {
            biggest = s;
          }
        }
        const reduction = Math.min(majorStatBoost, needed[biggest]);
        if (reduction === 0) {
          break;
        }
        needed[biggest] -= reduction;
        shortfall -= reduction;
        mods[biggest]++;
      }
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
        keptOwned: keptOwned.slice(),
        multisetIndices: multiset.indices,
        mods: mods.slice(),
        setDeficits: setDeficits.slice(),
      };
    }
  };

  const chosen: { bucket: number; index: number }[] = [];

  for (let m = 0; m <= numSlots; m++) {
    const multisets = multisetsBySize[m];
    for (const keepSlots of kSubsets(numSlots, numSlots - m)) {
      if (keepSlots.some((bucket) => ownedVecs[bucket].length === 0)) {
        continue;
      }
      const recur = (depth: number, partial: number[], setCounts: number[]) => {
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
            if (m < numSlots) {
              return;
            }
            setBonusUnsatisfiable = true;
          }
          for (const multiset of multisets) {
            evaluate(partial, multiset, m, chosen, deficits);
          }
          return;
        }
        const bucket = keepSlots[depth];
        const candidates = ownedVecs[bucket];
        for (let i = 0; i < candidates.length; i++) {
          const owned = candidates[i];
          const setBonusHash = owned.piece.setBonusHash;
          chosen.push({ bucket, index: i });
          recur(
            depth + 1,
            partial.map((v, s) => v + owned.stats[s]),
            setBonusHash === undefined
              ? setCounts
              : setCounts.map((c, r) => (reqSetHashes[r] === setBonusHash ? c + 1 : c)),
          );
          chosen.pop();
        }
      };
      recur(
        0,
        base,
        reqSetCounts.map(() => 0),
      );
    }
    if (best?.shortfall === 0 && best.m === m) {
      break;
    }
  }

  // With at least the all-hypothetical case (keep nothing) always evaluated,
  // best is guaranteed to be set.
  const result = best!;

  const countsByIndex = new Map<number, number>();
  for (const idx of result.multisetIndices) {
    countsByIndex.set(idx, (countsByIndex.get(idx) ?? 0) + 1);
  }
  const farm = [...countsByIndex.entries()].map(([idx, count]) => ({
    block: blocks[idx],
    count,
  }));
  const keep = result.keptOwned.map(({ bucket, index }) => ownedVecs[bucket][index].piece);
  const farmFromSets = setBonusRequirements
    .map((r, i) => ({ setHash: r.setHash, count: result.setDeficits[i] }))
    .filter((r) => r.count > 0);
  const modsPerStat = Object.fromEntries(armorStats.map((h) => [h, 0])) as ArmorStats;
  for (let s = 0; s < numStats; s++) {
    modsPerStat[statOrder[s]] = result.mods[s];
  }

  return {
    shortfall: result.shortfall,
    farm,
    keep,
    farmFromSets,
    setBonusUnsatisfiable,
    modsPerStat,
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

export interface HypotheticalPlan {
  /** Total stat points short of the target after armor + stat mods. 0 = reachable. */
  shortfall: number;
  /** The recommended composition: how many pieces of each block to farm. */
  counts: { block: HypotheticalArmorBlock; count: number }[];
  /** Stat totals from the armor alone. */
  armorTotals: ArmorStats;
  /** Number of +10 general stat mods assigned per stat. */
  modsPerStat: ArmorStats;
  /** How many 5-piece compositions were examined. */
  combosExamined: number;
}

/**
 * Find the 5-piece composition of hypothetical blocks that best satisfies the
 * stat targets, allowing for auto stat mods on top.
 *
 * Because hypothetical pieces are slot-interchangeable, sets are multisets:
 * we enumerate index combinations i0 <= i1 <= ... <= i4, which is C(n+4, 5)
 * combinations instead of n^5 — for n=48 that's ~2.6M instead of ~255M.
 *
 * Simplifications vs. the real worker (fine for a feasibility prototype):
 * exotics, set bonuses, tuning mods, and mod energy are ignored; stat mods are
 * modeled as up to 5 major (+10) general mods assigned greedily.
 */
export function planBestComposition(
  blocks: HypotheticalArmorBlock[],
  desiredStatRanges: DesiredStatRange[],
  numGeneralMods = 5,
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

  let combosExamined = 0;
  let bestShortfall = Number.MAX_SAFE_INTEGER;
  let bestScore = -1;
  let bestIndices: number[] | undefined;
  let bestMods: number[] | undefined;

  // Partial sums hoisted out of the inner loops, plus scratch arrays, all
  // reused across iterations to avoid allocation.
  const p1 = new Array<number>(numStats);
  const p2 = new Array<number>(numStats);
  const p3 = new Array<number>(numStats);
  const needed = new Array<number>(numStats);
  const mods = new Array<number>(numStats);

  for (let i0 = 0; i0 < n; i0++) {
    const s0 = blockStats[i0];
    for (let i1 = i0; i1 < n; i1++) {
      const s1 = blockStats[i1];
      for (let s = 0; s < numStats; s++) {
        p1[s] = s0[s] + s1[s];
      }
      for (let i2 = i1; i2 < n; i2++) {
        const s2 = blockStats[i2];
        for (let s = 0; s < numStats; s++) {
          p2[s] = p1[s] + s2[s];
        }
        for (let i3 = i2; i3 < n; i3++) {
          const s3 = blockStats[i3];
          for (let s = 0; s < numStats; s++) {
            p3[s] = p2[s] + s3[s];
          }
          for (let i4 = i3; i4 < n; i4++) {
            combosExamined++;
            const s4 = blockStats[i4];

            // Sum stats, clamp to the max constraint, and work out what's missing.
            let shortfall = 0;
            let score = 0;
            for (let s = 0; s < numStats; s++) {
              const value = Math.min(p3[s] + s4[s], maxStats[s]);
              const need = minStats[s] - value;
              needed[s] = need > 0 ? need : 0;
              shortfall += needed[s];
              score += value;
              mods[s] = 0;
            }

            // Greedily throw major stat mods at the biggest remaining gaps.
            if (shortfall > 0) {
              for (let m = 0; m < numGeneralMods && shortfall > 0; m++) {
                let biggest = 0;
                for (let s = 1; s < numStats; s++) {
                  if (needed[s] > needed[biggest]) {
                    biggest = s;
                  }
                }
                const reduction = Math.min(majorStatBoost, needed[biggest]);
                if (reduction === 0) {
                  break;
                }
                needed[biggest] -= reduction;
                shortfall -= reduction;
                mods[biggest]++;
              }
            }

            if (shortfall < bestShortfall || (shortfall === bestShortfall && score > bestScore)) {
              bestShortfall = shortfall;
              bestScore = score;
              bestIndices = [i0, i1, i2, i3, i4];
              bestMods = mods.slice();
            }
          }
        }
      }
    }
  }

  const countsByIndex = new Map<number, number>();
  for (const idx of bestIndices!) {
    countsByIndex.set(idx, (countsByIndex.get(idx) ?? 0) + 1);
  }
  const counts = [...countsByIndex.entries()].map(([idx, count]) => ({
    block: blocks[idx],
    count,
  }));

  const armorTotals = Object.fromEntries(armorStats.map((h) => [h, 0])) as ArmorStats;
  for (const { block, count } of counts) {
    for (const statHash of armorStats) {
      armorTotals[statHash] += block.stats[statHash] * count;
    }
  }
  const modsPerStat = Object.fromEntries(armorStats.map((h) => [h, 0])) as ArmorStats;
  for (let s = 0; s < numStats; s++) {
    modsPerStat[statOrder[s]] = bestMods![s];
  }

  return { shortfall: bestShortfall, counts, armorTotals, modsPerStat, combosExamined };
}
