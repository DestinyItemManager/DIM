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
 * By preprocessing all the assignments we skip a lot of work in the middle of the big process algorithm.
 */
export function canTakeSlotIndependentMods(
  generalModPermutations: (ProcessMod | null)[][],
  combatModPermutations: (ProcessMod | null)[][],
  activityModPermutations: (ProcessMod | null)[][],
  items: ProcessItem[]
) {
  // Sort the items like the mods are to try and get a greedy result
  // Theory here is that aligning energy types between items and mods and assigning the mods with the
  // highest cost to the items with the highest amount of energy available will find results faster
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

  // A quick check to see if we have enough of each energy type for the mods so we can exit early if not
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
  // It works by creating an index of tags to totals of said tag
  // we can then ensure we have enough items with said tags.
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

  // Now we begin looping over all the mod permutations, we have chosen activity mods because they
  // are the most selective. This is a similar principle to DB query theory where you want to run
  // the most selective part of your query first to narrow results down as early as possible. In
  // this case we can use it to skip large branches of the triple nested mod loop because not all
  // armour will have activity slots.
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

      // Energy is valid when the item has enough energy capacity and the items energy type
      // accommodates the mods energy. When we allow energy changes the item can have the Any
      // energy type
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

        // Energy is valid when the item has enough energy capacity for the activity and combat
        // mods, the items energy type accommodates the mods energy, and if an activity mod is
        // present the energy types of each mod are compatible, eg incompatible could be arc + void.
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

          // Energy is valid when the item has enough energy capacity for the activity, combat
          // and genreal mods, the items energy type accommodates the mods energy, and if activity
          // and combat mods are present the energy types of each mod are compatible
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

        // TODO For auto mods we will want to figure out what mods we can auto assign at this point.
        // This will mean looking at what is assigned to each item and assigning the most desirable
        // stat mod that will fit with the given energy use. For example, if intellect is the first
        // stat in our ordered stats but we only have 3 energy, we will probably need to decide on
        // using a +5 intellect or mobility (or whatever 3 cost stat mod is highest).
        // The hit on performance is going to be that we need to remove the `return true` following
        // this comment. Instead we will want to iterate over all mod combinations and find the best
        // auto assignment of mods and return said assignment. There may be an early exit for this
        // but I haven't quite figured that out in my head yet.

        // To hit this point we need to have found a valid set of activity mods
        // if none is found the continues will skip this.
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
