import { stubTrue } from 'app/utils/functions';
import { DestinyItemPlug, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import universalOrnamentPlugSetHashes from 'data/d2/universal-ornament-plugset-hashes.json';

/**
 * Get all plugs from the specified plugset. This includes whether the plugs are unlocked or not.
 * This returns unlocked plugs for a specific character or account-wide.
 */
function itemsForCharacterOrProfilePlugSet(
  profileResponse: DestinyProfileResponse,
  plugSetHash: number,
  characterId: string,
) {
  return (profileResponse.profilePlugSets.data?.plugs[plugSetHash] ?? []).concat(
    profileResponse.characterPlugSets.data?.[characterId]?.plugs[plugSetHash] ?? [],
  );
}

const HARMONIC_RESISTANCE = 1293710444; // InventoryItem "Harmonic Resistance"

export function filterUnlockedPlugs(
  plugSetHash: number,
  plugSetItems: DestinyItemPlug[],
  outUnlockedPlugs: Set<number>,
  predicate: (plug: DestinyItemPlug) => boolean = stubTrue,
) {
  const useCanInsert = universalOrnamentPlugSetHashes.includes(plugSetHash);
  for (const plugSetItem of plugSetItems) {
    if (
      ((useCanInsert ? plugSetItem.canInsert : plugSetItem.enabled) ||
        // Harmonic Resistance may report as disabled when the user
        // has Strand equipped since in that case, it provides...
        (plugSetItem.plugItemHash === HARMONIC_RESISTANCE &&
          plugSetItem.enableFailIndexes.length === 1 &&
          // ..."No Current Benefit"
          plugSetItem.enableFailIndexes[0] === 2)) &&
      predicate(plugSetItem)
    ) {
      outUnlockedPlugs.add(plugSetItem.plugItemHash);
    }
  }
}

/**
 * The set of plug item hashes that are unlocked in the given plugset by the given character.
 * TODO: would be great to precalculate/memoize this by character ID and profileResponse
 */
export function unlockedItemsForCharacterOrProfilePlugSet(
  profileResponse: DestinyProfileResponse,
  plugSetHash: number,
  characterId: string,
): Set<number> {
  const unlockedPlugs = new Set<number>();

  const plugSetItems = itemsForCharacterOrProfilePlugSet(profileResponse, plugSetHash, characterId);
  filterUnlockedPlugs(plugSetHash, plugSetItems, unlockedPlugs);
  return unlockedPlugs;
}
