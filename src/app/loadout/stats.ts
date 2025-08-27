import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { bungieNetPath } from 'app/dim-ui/BungieImage';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimCharacterStatSource } from 'app/inventory/store-types';
import { hashesToPluggableItems } from 'app/inventory/store/sockets';
import {
  isPlugStatActive,
  mapAndFilterInvestmentStats,
} from 'app/inventory/store/stats-conditional';
import { ArmorStatHashes, ModStatChanges } from 'app/loadout-builder/types';
import { ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { mapToOtherModCostVariant } from 'app/loadout/mod-utils';
import { armorStats } from 'app/search/d2-known-values';
import { filterMap, mapValues } from 'app/utils/collections';
import { emptyArray } from 'app/utils/empty';
import { HashLookup } from 'app/utils/util-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { StatHashes } from 'data/d2/generated-enums';
import { mapKeys, once } from 'es-toolkit';
import { edgeOfFateReleased } from './known-values';

/**
 * Font of X mods conditionally boost a single stat. This maps from
 * mod hash to boosted stat hash.
 */
const fontModHashToStatHash = once(() => {
  const baseFontModHashToStatHash: HashLookup<ArmorStatHashes> = {
    4046357305: StatHashes.Weapons, // InventoryItem "Weapons Font"
    686455429: StatHashes.Health, // InventoryItem "Health Font"
    1193713026: StatHashes.Class, // InventoryItem "Class Font"
    1781551382: StatHashes.Grenade, // InventoryItem "Grenade Font"
    1130820873: StatHashes.Super, // InventoryItem "Super Font"
    633101315: StatHashes.Melee, // InventoryItem "Melee Font"
  };

  return {
    ...baseFontModHashToStatHash,
    ...mapKeys(baseFontModHashToStatHash, (_val, hash) => mapToOtherModCostVariant(Number(hash))!),
  };
});

/** The boost for 0, 1, 2, 3 mods equipped. From Clarity data (old) and from
 * https://www.bungie.net/7/en/News/Article/twid_07_10_2025 for Edge of Fate
 * version. */
const boostForNumFontStacks = edgeOfFateReleased ? [0, 20, 40, 50] : [0, 30, 50, 60];

type FontModStatBoosts = {
  [statHash in ArmorStatHashes]?: {
    statHash: ArmorStatHashes;
    plugDef: PluggableInventoryItemDefinition;
    count: number;
    value: number;
  };
};

function getFontMods(mods: PluggableInventoryItemDefinition[]) {
  const boosts: FontModStatBoosts = {};
  for (const mod of mods) {
    const statHash = fontModHashToStatHash()[mod.hash];
    if (statHash) {
      (boosts[statHash] ??= { statHash, plugDef: mod, count: 0, value: 0 }).count += 1;
    }
  }

  return mapValues(boosts, (boost) => ({
    ...boost,
    value: boostForNumFontStacks[boost.count] ?? boostForNumFontStacks.at(-1),
  }));
}

/**
 * Does this list of mods have mods that dynamically grant stats, such as Font mods?
 */
export function includesRuntimeStatMods(modHashes: number[]) {
  return modHashes.some((mod) => fontModHashToStatHash()[mod] !== undefined);
}

/**
 * Given a mod assignment mapping (which goes from item ID to assigned mods),
 * produce a list of mod, item pairs. This is meant to be used in
 * getTotalModStatChanges.
 */
function invertModAssignments(
  itemModAssignments: {
    [itemInstanceId: string]: PluggableInventoryItemDefinition[];
  },
  armor: DimItem[],
): [PluggableInventoryItemDefinition, DimItem][] {
  return Object.entries(itemModAssignments).flatMap(([itemId, mods]) =>
    filterMap(mods, (m): [PluggableInventoryItemDefinition, DimItem] | undefined => {
      const item = armor.find((i) => i.id === itemId);
      return item ? ([m, item] as const) : undefined;
    }),
  );
}

/**
 * This sums up the total stat contributions across mods passed in. These are then applied
 * to the loadouts after all the items' base stat values have been summed. This mimics how mods
 * affect stat values in game and allows us to do some preprocessing.
 */
export function getTotalModStatChanges(
  defs: D2ManifestDefinitions,
  /** The mods to compute stats for. When itemModAssignments is passed, this should be the list of unassigned mods. */
  lockedMods: PluggableInventoryItemDefinition[],
  subclass: ResolvedLoadoutItem | undefined,
  characterClass: DestinyClass,
  /**
   * If set, this simulates the dynamically granted stat effects of certain mods
   * that are active under specific conditions so that they don't have investmentStats,
   * but are active often enough to be important for loadout building.
   */
  includeRuntimeStatBenefits: boolean,
  /**
   * When getting mod benefits for auto stat mods, we need to know what the
   * items we assigned to are, so that we can correctly calculate conditional
   * stats.
   */
  itemModAssignments?: {
    [itemInstanceId: string]: PluggableInventoryItemDefinition[];
  },
  /** When itemModAssigments is provided, we also need the list of items. */
  armor?: DimItem[],
) {
  const subclassPlugs = subclass?.loadoutItem.socketOverrides
    ? hashesToPluggableItems(defs, Object.values(subclass.loadoutItem.socketOverrides))
    : emptyArray<PluggableInventoryItemDefinition>();

  const totals: ModStatChanges = {
    [StatHashes.Weapons]: { value: 0, breakdown: [] },
    [StatHashes.Health]: { value: 0, breakdown: [] },
    [StatHashes.Class]: { value: 0, breakdown: [] },
    [StatHashes.Grenade]: { value: 0, breakdown: [] },
    [StatHashes.Super]: { value: 0, breakdown: [] },
    [StatHashes.Melee]: { value: 0, breakdown: [] },
  };

  const lockedModAssignments = (
    [
      ...(itemModAssignments && armor ? invertModAssignments(itemModAssignments, armor) : []),
      ...lockedMods.map((m) => [m, undefined]),
    ] as [PluggableInventoryItemDefinition, DimItem | undefined][]
  ).sort(([a], [b]) => a.hash - b.hash);

  const processPlugs = (
    modAssignments:
      | PluggableInventoryItemDefinition[]
      | [PluggableInventoryItemDefinition, DimItem | undefined][],
    source: DimCharacterStatSource,
  ) => {
    for (const modAssignment of modAssignments) {
      const [mod, item] = Array.isArray(modAssignment) ? modAssignment : [modAssignment, undefined];
      for (const stat of mapAndFilterInvestmentStats(mod)) {
        if (
          stat.statTypeHash in totals &&
          isPlugStatActive(stat.activationRule, {
            classType: characterClass,
            statHash: stat.statTypeHash,
            item,
          })
        ) {
          const value = stat.value;
          totals[stat.statTypeHash as ArmorStatHashes].value += value;
          const breakdown = totals[stat.statTypeHash as ArmorStatHashes].breakdown!;
          const lastEntry = breakdown[breakdown.length - 1];
          if (lastEntry?.hash === mod.hash) {
            // merge stacks of the same mod
            lastEntry.count!++;
            lastEntry.value += value;
          } else {
            totals[stat.statTypeHash as ArmorStatHashes].breakdown!.push({
              name: mod.displayProperties.name,
              icon: bungieNetPath(mod.displayProperties.icon),
              hash: mod.hash,
              count: 1,
              source,
              value,
            });
          }
        }
      }
    }
  };

  processPlugs(subclassPlugs, 'subclassPlug');
  processPlugs(lockedModAssignments, 'armorPlug');

  if (includeRuntimeStatBenefits) {
    const lockedMods = lockedModAssignments.map(([m]) => m);
    const fontCounts = getFontMods(lockedMods);
    for (const statHash of armorStats) {
      const fonts = fontCounts[statHash];
      if (fonts) {
        totals[statHash].value += fonts.value;
        totals[statHash].breakdown!.push({
          name: fonts.plugDef.displayProperties.name,
          icon: bungieNetPath(fonts.plugDef.displayProperties.icon),
          hash: fonts.plugDef.hash,
          count: fonts.count,
          source: 'runtimeEffect',
          value: fonts.value,
        });
      }
    }
  }

  return totals;
}
