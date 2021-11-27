import { generatePermutationsOfFive } from 'app/loadout/mod-permutations';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { ProcessItem, ProcessMod } from './types';

interface SortParam {
  energy?: {
    type: DestinyEnergyType;
    val: number;
  };
}

export interface ProcessItemSubset extends SortParam {
  id: string;
  compatibleModSeasons?: string[];
}

/**
 * This sorts process mods and items in the same manner as we try for greedy results.
 */
export function sortProcessModsOrItems(a: SortParam, b: SortParam) {
  if (a.energy && b.energy) {
    if (a.energy.type === b.energy.type) {
      return b.energy.val - a.energy.val;
    } else {
      return b.energy.type - a.energy.type;
    }
  } else if (!a.energy) {
    return 1;
  }

  return -1;
}

export function stringifyModPermutation(perm: (ProcessMod | null)[]) {
  let permString = '';
  for (const modOrNull of perm) {
    if (modOrNull) {
      permString += `(${modOrNull.energy?.type},${modOrNull.energy?.val},${modOrNull.tag || ''})`;
    }
    permString += ',';
  }
  return permString;
}

function getEnergyCounts(modsOrItems: (ProcessMod | null | ProcessItemSubset)[]) {
  let arcCount = 0;
  let solarCount = 0;
  let voidCount = 0;
  let stasisCount = 0;
  let anyCount = 0;

  for (const item of modsOrItems) {
    switch (item?.energy?.type) {
      case DestinyEnergyType.Arc:
        arcCount += 1;
        break;
      case DestinyEnergyType.Thermal:
        solarCount += 1;
        break;
      case DestinyEnergyType.Void:
        voidCount += 1;
        break;
      case DestinyEnergyType.Any:
        anyCount += 1;
        break;
      case DestinyEnergyType.Stasis:
        stasisCount += 1;
        break;
      default:
        break;
    }
  }

  return [arcCount, solarCount, voidCount, stasisCount, anyCount];
}

// Used for null values
const defaultModEnergy = { val: 0, type: DestinyEnergyType.Any };

/**
 * This figures out if all general, combat and activity mods can be assigned to an armour set.
 *
 * The params generalModPermutations, combatModPermutations, activityModPermutations are assumed to be the results
 * from processUtils.ts#generateModPermutations, i.e. all permutations of general, combat or activity mods.
 *
 * assignments is mutated by this function to store any mods assignments that were made.
 */
export function canTakeSlotIndependentMods(
  generalModPermutations: (ProcessMod | null)[][],
  combatModPermutations: (ProcessMod | null)[][],
  activityModPermutations: (ProcessMod | null)[][],
  items: ProcessItem[]
) {
  // Sort the items like the mods are to try and get a greedy result
  const sortedItems = Array.from(items).sort(sortProcessModsOrItems);

  const [arcItems, solarItems, voidItems, stasisItems, anyItems] = getEnergyCounts(sortedItems);
  const [arcCombatMods, solarCombatMods, voidCombatMods, stasisCombatMods] = getEnergyCounts(
    combatModPermutations[0]
  );
  const [arcGeneralMods, solarGeneralMods, voidGeneralMods, stasisGeneralMods] = getEnergyCounts(
    generalModPermutations[0]
  );
  const [arcActivityMods, solarActivityMods, voidActivityMods, stasisActivityMods] =
    getEnergyCounts(activityModPermutations[0]);

  // A quick check to see if we have enough of each energy type for the mods
  if (
    voidItems + anyItems < voidGeneralMods ||
    voidItems + anyItems < voidCombatMods ||
    voidItems + anyItems < voidActivityMods ||
    solarItems + anyItems < solarGeneralMods ||
    solarItems + anyItems < solarCombatMods ||
    solarItems + anyItems < solarActivityMods ||
    arcItems + anyItems < arcGeneralMods ||
    arcItems + anyItems < arcCombatMods ||
    arcItems + anyItems < arcActivityMods ||
    stasisItems + anyItems < stasisGeneralMods ||
    stasisItems + anyItems < stasisCombatMods ||
    stasisItems + anyItems < stasisActivityMods
  ) {
    return false;
  }

  // An early check to ensure we have enough activity mod combos
  if (activityModPermutations[0].length) {
    const tagCounts: { [tag: string]: number } = {};

    for (const mod of activityModPermutations[0]) {
      if (mod?.tag) {
        tagCounts[mod.tag] = (tagCounts[mod.tag] || 0) + 1;
      }
    }

    for (const tag of Object.keys(tagCounts)) {
      let socketsCount = 0;
      for (const item of items) {
        if (item.compatibleModSeasons?.includes(tag)) {
          socketsCount++;
        }
      }
      if (socketsCount < tagCounts[tag]) {
        return false;
      }
    }
  }

  activityModLoop: for (const activityPermutation of activityModPermutations) {
    activityItemLoop: for (let i = 0; i < sortedItems.length; i++) {
      const activityMod = activityPermutation[i];

      // If a mod is null there is nothing being socketed into the item so move on
      if (!activityMod) {
        continue activityItemLoop;
      }

      const item = sortedItems[i];
      const tag = activityMod.tag!;
      const activityEnergy = activityMod.energy || defaultModEnergy;

      const activityEnergyIsValid =
        item.energy &&
        item.energy.val + activityEnergy.val <= item.energy.capacity &&
        (item.energy.type === activityEnergy.type ||
          activityEnergy.type === DestinyEnergyType.Any ||
          item.energy.type === DestinyEnergyType.Any);

      // The activity mods wont fit in the item set so move on to the next set of mods
      if (!activityEnergyIsValid || !item.compatibleModSeasons?.includes(tag)) {
        continue activityModLoop;
      }
    }

    combatModLoop: for (const combatPermutation of combatModPermutations) {
      combatItemLoop: for (let i = 0; i < sortedItems.length; i++) {
        const combatMod = combatPermutation[i];

        // If a mod is null there is nothing being socketed into the item so move on
        if (!combatMod) {
          continue combatItemLoop;
        }

        const item = sortedItems[i];
        const combatEnergy = combatMod.energy || defaultModEnergy;
        const tag = combatMod.tag!;
        const activityEnergy = activityPermutation[i]?.energy || defaultModEnergy;

        const combatEnergyIsValid =
          item.energy &&
          item.energy.val + combatEnergy.val + activityEnergy.val <= item.energy.capacity &&
          (item.energy.type === combatEnergy.type ||
            combatEnergy.type === DestinyEnergyType.Any ||
            item.energy.type === DestinyEnergyType.Any) &&
          (activityEnergy.type === combatEnergy.type ||
            combatEnergy.type === DestinyEnergyType.Any ||
            activityEnergy.type === DestinyEnergyType.Any);

        // The combat mods wont fit in the item set so move on to the next set of mods
        if (!combatEnergyIsValid || !item.compatibleModSeasons?.includes(tag)) {
          continue combatModLoop;
        }
      }

      generalModLoop: for (const generalModPermutation of generalModPermutations) {
        generalItemLoop: for (let i = 0; i < sortedItems.length; i++) {
          const generalMod = generalModPermutation[i];

          // If a mod is null there is nothing being socketed into the item so move on
          if (!generalMod) {
            continue generalItemLoop;
          }

          const item = sortedItems[i];
          const generalEnergy = generalMod.energy || defaultModEnergy;
          const combatEnergy = combatPermutation[i]?.energy || defaultModEnergy;
          const activityEnergy = activityPermutation[i]?.energy || defaultModEnergy;

          const generalEnergyIsValid =
            item.energy &&
            item.energy.val + generalEnergy.val + combatEnergy.val + activityEnergy.val <=
              item.energy.capacity &&
            (item.energy.type === generalEnergy.type ||
              generalEnergy.type === DestinyEnergyType.Any ||
              item.energy.type === DestinyEnergyType.Any) &&
            (combatEnergy.type === generalEnergy.type ||
              generalEnergy.type === DestinyEnergyType.Any ||
              combatEnergy.type === DestinyEnergyType.Any) &&
            (activityEnergy.type === generalEnergy.type ||
              generalEnergy.type === DestinyEnergyType.Any ||
              activityEnergy.type === DestinyEnergyType.Any);

          // The general mods wont fit in the item set so move on to the next set of mods
          if (!generalEnergyIsValid) {
            continue generalModLoop;
          }
        }

        // To hit this point we need to have found a valid set of activity mods
        // if none is found the continue's will skip this.
        return true;
      }
    }
  }

  return false;
}

export function generateProcessModPermutations(mods: (ProcessMod | null)[]) {
  // Creates a string from the mod permutation containing the unique properties
  // that we care about, so we can reduce to the minimum number of permutations.
  // If two different mods that fit in the same socket have the same energy type
  // and cost, they are identical from the mod assignment perspective.
  // This works because we check to see if we have already recorded this string
  // in heaps algorithm before we add the permutation to the result.
  const createPermutationKey = (permutation: (ProcessMod | null)[]) =>
    permutation
      .map((mod) => {
        if (mod) {
          const energyType = mod.energy?.type || DestinyEnergyType.Any;
          const energyCost = mod.energy?.val || 0;
          return `${energyType}${energyCost}${mod.tag}`;
        }
      })
      .join(',');
  return generatePermutationsOfFive(mods, createPermutationKey);
}
