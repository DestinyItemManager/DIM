import { DimPlugSet } from 'app/inventory/item-types';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import universalOrnamentPlugSetHashes from 'data/d2/universal-ornament-plugset-hashes.json';

/**
 * Get all plugs from the specified plugset. This includes whether the plugs are unlocked or not.
 * This returns unlocked plugs for a specific character or account-wide.
 */
export function itemsForCharacterOrProfilePlugSet(
  profileResponse: DestinyProfileResponse,
  plugSetHash: number,
  characterId: string
) {
  return (profileResponse.profilePlugSets.data?.plugs[plugSetHash] ?? []).concat(
    profileResponse.characterPlugSets.data?.[characterId]?.plugs[plugSetHash] ?? []
  );
}

// https://github.com/Bungie-net/api/issues/1757
// These should really be removed sooner rather than later
const additionalPlugSetsToCheck = {
  963686427: 4120188593,
};

/**
 * The set of plug item hashes that are unlocked in the given plugset by the given character.
 */
export function unlockedItemsForCharacterOrProfilePlugSet(
  profileResponse: DestinyProfileResponse,
  plugSetHash: number,
  characterId: string
): Set<number> {
  const unlockedPlugs = new Set<number>();

  let plugSetItems = itemsForCharacterOrProfilePlugSet(profileResponse, plugSetHash, characterId);
  const checkSubset = additionalPlugSetsToCheck[plugSetHash];
  if (checkSubset) {
    plugSetItems = plugSetItems.concat(
      itemsForCharacterOrProfilePlugSet(profileResponse, checkSubset, characterId)
    );
  }
  const useCanInsert = universalOrnamentPlugSetHashes.includes(plugSetHash);
  // TODO: would be great to precalculate/memoize this by character ID and profileResponse
  for (const plugSetItem of plugSetItems) {
    // TODO: https://github.com/DestinyItemManager/DIM/issues/7561
    if (useCanInsert ? plugSetItem.canInsert : plugSetItem.enabled) {
      unlockedPlugs.add(plugSetItem.plugItemHash);
    }
  }
  return unlockedPlugs;
}

/**
 * Narrow down the passed in plugSet's plugs to only those that are unlocked by the given character.
 */
export function filterDimPlugsUnlockedOnCharacterOrProfile(
  profileResponse: DestinyProfileResponse,
  dimPlugSet: DimPlugSet,
  characterId: string
) {
  const unlockedPlugs = unlockedItemsForCharacterOrProfilePlugSet(
    profileResponse,
    dimPlugSet.hash,
    characterId
  );
  return dimPlugSet.plugs.filter((plug) => unlockedPlugs.has(plug.plugDef.hash));
}

/**
 * Get all plugs from the specified plugset. This includes whether the plugs are unlocked or not.
 * This only returns plugsets that are account-wide.
 */
export function itemsForProfilePlugSet(
  profileResponse: DestinyProfileResponse,
  plugSetHash: number
) {
  return profileResponse.profilePlugSets.data?.plugs[plugSetHash] ?? [];
}
