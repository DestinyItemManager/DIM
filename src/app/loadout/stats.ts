import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { bungieNetPath } from 'app/dim-ui/BungieImage';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
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
import { emptyArray } from 'app/utils/empty';
import { HashLookup } from 'app/utils/util-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';

/**
 * Font of X mods conditionally boost a single stat. This maps from
 * mod hash to boosted stat hash.
 */
const fontModHashToStatHash = _.once(() => {
  const baseFontModHashToStatHash: HashLookup<ArmorStatHashes> = {
    4046357305: StatHashes.Mobility, // InventoryItem "Font of Agility"
    686455429: StatHashes.Resilience, // InventoryItem "Font of Endurance"
    1193713026: StatHashes.Recovery, // InventoryItem "Font of Restoration"
    1781551382: StatHashes.Discipline, // InventoryItem "Font of Focus"
    1130820873: StatHashes.Intellect, // InventoryItem "Font of Wisdom"
    633101315: StatHashes.Strength, // InventoryItem "Font of Vigor"
  };

  return {
    ...baseFontModHashToStatHash,
    ..._.mapKeys(
      baseFontModHashToStatHash,
      (_val, hash) => mapToOtherModCostVariant(parseInt(hash, 10))!,
    ),
  };
});

/** The boost for 0, 1, 2, 3 mods equipped. From Clarity data */
const boostForNumFontStacks = [0, 30, 50, 60];

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

  return _.mapValues(boosts, (boost) => ({
    ...boost!,
    value: boostForNumFontStacks[boost!.count] ?? boostForNumFontStacks.at(-1),
  }));
}

/**
 * Does this list of mods have mods that dynamically grant stats, such as Font mods?
 */
export function includesRuntimeStatMods(modHashes: number[]) {
  return modHashes.some((mod) => fontModHashToStatHash()[mod] !== undefined);
}

/**
 * This sums up the total stat contributions across mods passed in. These are then applied
 * to the loadouts after all the items' base stat values have been summed. This mimics how mods
 * affect stat values in game and allows us to do some preprocessing.
 */
export function getTotalModStatChanges(
  defs: D2ManifestDefinitions,
  lockedMods: PluggableInventoryItemDefinition[],
  subclass: ResolvedLoadoutItem | undefined,
  characterClass: DestinyClass,
  /**
   * If set, this simulates the dynamically granted stat effects of certain mods
   * that are active under specific conditions so that they don't have investmentStats,
   * but are active often enough to be important for loadout building.
   */
  includeRuntimeStatBenefits: boolean,
) {
  const subclassPlugs = subclass?.loadoutItem.socketOverrides
    ? hashesToPluggableItems(defs, Object.values(subclass.loadoutItem.socketOverrides))
    : emptyArray<PluggableInventoryItemDefinition>();

  const totals: ModStatChanges = {
    [StatHashes.Mobility]: { value: 0, breakdown: [] },
    [StatHashes.Resilience]: { value: 0, breakdown: [] },
    [StatHashes.Recovery]: { value: 0, breakdown: [] },
    [StatHashes.Discipline]: { value: 0, breakdown: [] },
    [StatHashes.Intellect]: { value: 0, breakdown: [] },
    [StatHashes.Strength]: { value: 0, breakdown: [] },
  };

  const processPlugs = (
    plugs: PluggableInventoryItemDefinition[],
    source: DimCharacterStatSource,
  ) => {
    const grouped = Map.groupBy(plugs, (plug) => plug.hash);
    for (const plugCopies of grouped.values()) {
      const mod = plugCopies[0];
      const modCount = plugCopies.length;
      for (const stat of mapAndFilterInvestmentStats(mod)) {
        if (
          stat.statTypeHash in totals &&
          isPlugStatActive(stat.activityRule, undefined, characterClass)
        ) {
          const value = stat.value * modCount;
          totals[stat.statTypeHash as ArmorStatHashes].value += value;
          totals[stat.statTypeHash as ArmorStatHashes].breakdown!.push({
            name: mod.displayProperties.name,
            icon: bungieNetPath(mod.displayProperties.icon),
            hash: mod.hash,
            count: modCount,
            source,
            value,
          });
        }
      }
    }
  };

  processPlugs(subclassPlugs, 'subclassPlug');
  processPlugs(lockedMods, 'armorPlug');

  if (includeRuntimeStatBenefits) {
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
