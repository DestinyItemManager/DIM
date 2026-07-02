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
  const numStats = desiredStatRanges.length;
  const statOrder = desiredStatRanges.map(({ statHash }): ArmorStatHashes => statHash);
  // Per-block stat arrays in desiredStatRanges order, for tight inner loops.
  const blockStats = blocks.map((block) => statOrder.map((statHash) => block.stats[statHash]));

  let combosExamined = 0;
  let bestShortfall = Number.MAX_SAFE_INTEGER;
  let bestScore = -1;
  let bestIndices: number[] | undefined;
  let bestMods: number[] | undefined;

  const needed = new Array<number>(numStats);
  const mods = new Array<number>(numStats);

  for (let i0 = 0; i0 < n; i0++) {
    for (let i1 = i0; i1 < n; i1++) {
      for (let i2 = i1; i2 < n; i2++) {
        for (let i3 = i2; i3 < n; i3++) {
          for (let i4 = i3; i4 < n; i4++) {
            combosExamined++;
            const s0 = blockStats[i0];
            const s1 = blockStats[i1];
            const s2 = blockStats[i2];
            const s3 = blockStats[i3];
            const s4 = blockStats[i4];

            // Sum stats, clamp to the max constraint, and work out what's missing.
            let shortfall = 0;
            let score = 0;
            for (let s = 0; s < numStats; s++) {
              const { minStat, maxStat } = desiredStatRanges[s];
              const value = Math.min(s0[s] + s1[s] + s2[s] + s3[s] + s4[s], maxStat);
              needed[s] = Math.max(0, minStat - value);
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
