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
      default:
        break;
    }
  }

  return [arcCount, solarCount, voidCount, anyCount];
}

// Used for null values
const defaultModEnergy = { val: 0, type: DestinyEnergyType.Any };

/**
 * This figures out if all general, other and raid mods can be assigned to an armour set.
 *
 * The params generalModPermutations, combatModPermutations, raidModPermutations are assumed to be the results
 * from processUtils.ts#generateModPermutations, i.e. all permutations of general, other or raid mods.
 *
 * assignments is mutated by this function to store any mods assignments that were made.
 */
export function canTakeSlotIndependantMods(
  generalModPermutations: (ProcessMod | null)[][],
  combatModPermutations: (ProcessMod | null)[][],
  raidModPermutations: (ProcessMod | null)[][],
  items: ProcessItem[]
) {
  // Sort the items like the mods are to try and get a greedy result
  const sortedItems = Array.from(items).sort(sortProcessModsOrItems);

  const [arcItems, solarItems, voidItems, anyItems] = getEnergyCounts(sortedItems);
  const [arcSeasonalMods, solarSeasonalMods, voidSeasonalMods] = getEnergyCounts(
    combatModPermutations[0]
  );
  const [arcGeneralMods, solarGeneralMods, voidGeneralMods] = getEnergyCounts(
    generalModPermutations[0]
  );
  const [arcRaidMods, solarRaidMods, voidRaidMods] = getEnergyCounts(raidModPermutations[0]);

  // A quick check to see if we have enough of each energy type for the mods
  if (
    voidItems + anyItems < voidGeneralMods ||
    voidItems + anyItems < voidSeasonalMods ||
    voidItems + anyItems < voidRaidMods ||
    solarItems + anyItems < solarGeneralMods ||
    solarItems + anyItems < solarSeasonalMods ||
    solarItems + anyItems < solarRaidMods ||
    arcItems + anyItems < arcGeneralMods ||
    arcItems + anyItems < arcSeasonalMods ||
    arcItems + anyItems < arcRaidMods
  ) {
    return false;
  }

  raidModLoop: for (const raidPermutation of raidModPermutations) {
    raidItemLoop: for (let i = 0; i < sortedItems.length; i++) {
      const raidMod = raidPermutation[i];

      // If a mod is null there is nothing being socketed into the item so move on
      if (!raidMod) {
        continue raidItemLoop;
      }

      const item = sortedItems[i];
      const tag = raidMod.tag!;
      const raidEnergy = raidMod.energy || defaultModEnergy;

      const raidEnergyIsValid =
        item.energy &&
        item.energy.val + raidEnergy.val <= item.energy.capacity &&
        (item.energy.type === raidEnergy.type ||
          raidEnergy.type === DestinyEnergyType.Any ||
          item.energy.type === DestinyEnergyType.Any);

      // The raid mods wont fit in the item set so move on to the next set of mods
      if (!raidEnergyIsValid || !item.compatibleModSeasons?.includes(tag)) {
        continue raidModLoop;
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
        const raidEnergy = raidPermutation[i]?.energy || defaultModEnergy;

        const combatEnergyIsValid =
          item.energy &&
          item.energy.val + combatEnergy.val + raidEnergy.val <= item.energy.capacity &&
          (item.energy.type === combatEnergy.type ||
            combatEnergy.type === DestinyEnergyType.Any ||
            item.energy.type === DestinyEnergyType.Any) &&
          (raidEnergy.type === combatEnergy.type ||
            combatEnergy.type === DestinyEnergyType.Any ||
            raidEnergy.type === DestinyEnergyType.Any);

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
          const raidEnergy = raidPermutation[i]?.energy || defaultModEnergy;

          const generalEnergyIsValid =
            item.energy &&
            item.energy.val + generalEnergy.val + combatEnergy.val + raidEnergy.val <=
              item.energy.capacity &&
            (item.energy.type === generalEnergy.type ||
              generalEnergy.type === DestinyEnergyType.Any ||
              item.energy.type === DestinyEnergyType.Any) &&
            (combatEnergy.type === generalEnergy.type ||
              generalEnergy.type === DestinyEnergyType.Any ||
              combatEnergy.type === DestinyEnergyType.Any) &&
            (raidEnergy.type === generalEnergy.type ||
              generalEnergy.type === DestinyEnergyType.Any ||
              raidEnergy.type === DestinyEnergyType.Any);

          // The general mods wont fit in the item set so move on to the next set of mods
          if (!generalEnergyIsValid) {
            continue generalModLoop;
          }
        }

        // To hit this point we need to have found a valid set of raid mods
        // if none is found the continue's will skip this.
        return true;
      }
    }
  }

  return false;
}
