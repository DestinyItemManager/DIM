import { ProcessMod } from './types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { MAX_ARMOR_ENERGY_CAPACITY } from '../../search/d2-known-values';

interface SortParam {
  energy: {
    type: DestinyEnergyType;
    val: number;
  } | null;
  season?: number;
}

export interface ProcessItemSubset extends SortParam {
  id: string;
  compatibleModSeasons?: string[];
}

/**
 * This sorting function is pivitol in the algorithm to figure out it seasonal mods can be slotted into
 * a list of items. It sorts by season and then energyType in descending order.
 */
export function sortProcessModsOrProcessItems(a: SortParam, b: SortParam) {
  if (a.season && b.season) {
    if (a.season === b.season) {
      if (a.energy && b.energy) {
        if (a.energy.type === b.energy.type) {
          return b.energy.val - a.energy.val;
        } else {
          return b.energy.type - a.energy.type;
        }
      }
    } else {
      return b.season - a.season;
    }
    // I don't think the following cases will every happen but I have included them just incase.
  } else if (a.season === undefined) {
    return 1;
  }
  return -1;
}

/**
 * This sorting function is pivitol in the algorithm to figure out it general mods can be slotted into
 * a list of items. It sorts by energyType in descending order.
 */
export function sortGeneralModsOrProcessItem(a: SortParam, b: SortParam) {
  // any energy is 0 so check undefined rather than falsey
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

/**
 * See if we can slot all the locked seasonal mods.
 *
 * This function need to be kept inline with ../mod-utils#assignAllSeasonalMods.
 *
 * @param processedMods These mods must be sorted by sortProcessModsOrProcessItems.
 * @param items The process items to test for mod slotting.
 * @param assignments This is an optional object that tracks item ids to mod hashes so
 *  that mods can be displayed for items in the UI. If passed in it is mutated.
 */
export function canTakeAllSeasonalMods(
  processedMods: ProcessMod[],
  items: ProcessItemSubset[],
  assignments?: Record<string, number[]>
) {
  const sortedItems = Array.from(items).sort(sortProcessModsOrProcessItems);

  let modIndex = 0;
  let itemIndex = 0;

  // Loop over the items and mods in parallel and see if they can be slotted.
  // due to Any energy mods needing to consider skipped items we reset item index after each splice.
  while (modIndex < processedMods.length && itemIndex < sortedItems.length) {
    const { energy, tag, hash } = processedMods[modIndex];
    const item = sortedItems[itemIndex];
    if (!tag) {
      // This should never happen but if it does we ignore seasonal requirements and log the warning.
      console.warn('Optimiser: Found seasonal mod without season details.');
      return true;
    }
    if (
      item.energy &&
      (item.energy.type === energy.type || energy.type === DestinyEnergyType.Any) &&
      item.energy.val + energy.val <= MAX_ARMOR_ENERGY_CAPACITY &&
      item.compatibleModSeasons?.includes(tag)
    ) {
      if (assignments) {
        assignments[item.id].push(hash);
      }
      item.energy.val += energy.val;
      sortedItems.splice(itemIndex, 1);
      modIndex += 1;
      itemIndex = 0;
    } else {
      itemIndex += 1;
    }
  }

  // This will indicate we have iterated over all the mods, it will overshoot the length on success.
  return processedMods.length === modIndex;
}

/**
 * See if we can slot all the locked general mods.
 *
 * This function need to be kept inline with ../mod-utils#assignAllGeneralMods.
 *
 * @param processedMods These mods must be sorted by sortGeneralModsOrProcessItem.
 * @param items The process items to test for mod slotting.
 * @param assignments This is an optional object that tracks item ids to mod hashes so
 *  that mods can be displayed for items in the UI. If passed in it is mutated.
 */
export function canTakeAllGeneralMods(
  processedMods: ProcessMod[],
  items: ProcessItemSubset[],
  assignments?: Record<string, number[]>
) {
  const sortedItems = Array.from(items).sort(sortGeneralModsOrProcessItem);

  let modIndex = 0;
  let itemIndex = 0;

  // Loop over the items and mods in parallel and see if they can be slotted.
  // We need to reset the index after a match to ensure that mods with the Any energy type
  // use up armour items that didn't match an energy type/season first.
  while (modIndex < processedMods.length && itemIndex < sortedItems.length) {
    const { energy, hash } = processedMods[modIndex];
    const item = sortedItems[itemIndex];
    if (
      item.energy &&
      (item.energy.type === energy.type || energy.type === DestinyEnergyType.Any) &&
      item.energy.val + energy.val <= MAX_ARMOR_ENERGY_CAPACITY
    ) {
      if (assignments) {
        assignments[item.id].push(hash);
      }
      item.energy.val += energy.val;
      sortedItems.splice(itemIndex, 1);
      modIndex += 1;
      itemIndex = 0;
    } else {
      itemIndex += 1;
    }
  }

  // This will indicate we have iterated over all the mods, it will overshoot the length on success.
  return processedMods.length === modIndex;
}
