import { ProcessModMetadata, ProcessItem } from './types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';

export interface SeasonalSortModOrItem {
  energyType?: DestinyEnergyType;
  season?: number;
}

export function sortSeasonalModsOrItems(a: SeasonalSortModOrItem, b: SeasonalSortModOrItem) {
  if (a.season && b.season) {
    // any energy is 0 but armour always has energy
    if (a.season === b.season && a.energyType && b.energyType) {
      return b.energyType - a.energyType;
    }
    return b.season - a.season;
  } else if (!a.season) {
    return 1;
  }
  return -1;
}

/**
 * See if we can slot all the locked seasonal mods.
 *
 * @param processedMods These mods must be sorted in the same manner as the item sort function below.
 * @param items The process items to test for mod slotting.
 */
export function canTakeAllSeasonalMods(processedMods: ProcessModMetadata[], items: ProcessItem[]) {
  const sortedItems = [...items].sort(sortSeasonalModsOrItems);

  let modIndex = 0;
  let itemIndex = 0;

  // loop over the items and mods in parallel and see if they can be slotted.
  // due to energy mods needing to consider skipped items we reset item index after each splice.
  while (modIndex < processedMods.length && itemIndex < sortedItems.length) {
    const { energyType, tag } = processedMods[modIndex];
    if (
      (sortedItems[itemIndex].energyType === energyType || energyType === DestinyEnergyType.Any) &&
      sortedItems[itemIndex].compatibleModSeasons?.includes(tag)
    ) {
      modIndex += 1;
      itemIndex = 0;
      sortedItems.splice(itemIndex, 1);
    } else {
      itemIndex += 1;
    }
  }

  // This will indicate we have iterated over all the mods
  return processedMods.length === modIndex;
}
