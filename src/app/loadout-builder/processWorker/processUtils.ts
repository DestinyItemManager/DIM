import { ProcessModMetadata } from './types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';

interface SortParam {
  energyType?: DestinyEnergyType;
  season?: number;
}

export interface ProcessItemSubset extends SortParam {
  compatibleModSeasons?: string[];
}

export function sortProcessModMetadataOrProcessItem(a: SortParam, b: SortParam) {
  if (a.season && b.season) {
    // any energy is 0 so check undefined rather than falsey
    if (a.season === b.season && a.energyType !== undefined && b.energyType !== undefined) {
      return b.energyType - a.energyType;
    }
    return b.season - a.season;
    // I don't think the following cases will every happen but I have included them just incase.
  } else if (a.season === undefined) {
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
export function canTakeAllSeasonalMods(
  processedMods: ProcessModMetadata[],
  items: ProcessItemSubset[]
) {
  const sortedItems = [...items].sort(sortProcessModMetadataOrProcessItem);

  let modIndex = 0;
  let itemIndex = 0;

  // Loop over the items and mods in parallel and see if they can be slotted.
  // due to Any energy mods needing to consider skipped items we reset item index after each splice.
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

  // This will indicate we have iterated over all the mods, it will overshoot the length on success.
  return processedMods.length === modIndex;
}
