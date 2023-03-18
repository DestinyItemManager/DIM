import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import universalOrnamentPlugSetHashes from 'data/d2/universal-ornament-plugset-hashes.json';

/**
 * Get all plugs from the specified plugset. This includes whether the plugs are unlocked or not.
 * This returns unlocked plugs for a specific character or account-wide.
 */
function itemsForCharacterOrProfilePlugSet(
  profileResponse: DestinyProfileResponse,
  plugSetHash: number,
  characterId: string
) {
  return (profileResponse.profilePlugSets.data?.plugs[plugSetHash] ?? []).concat(
    profileResponse.characterPlugSets.data?.[characterId]?.plugs[plugSetHash] ?? []
  );
}

/**
 * The set of plug item hashes that are unlocked in the given plugset by the given character.
 */
export function unlockedItemsForCharacterOrProfilePlugSet(
  profileResponse: DestinyProfileResponse,
  plugSetHash: number,
  characterId: string
): Set<number> {
  const unlockedPlugs = new Set<number>();

  const plugSetItems = itemsForCharacterOrProfilePlugSet(profileResponse, plugSetHash, characterId);
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
