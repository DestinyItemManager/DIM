import { DimPlugSet } from 'app/inventory/item-types';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';

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

export function filterDimPlugsAvailableToCharacerOrProfile(
  profileResponse: DestinyProfileResponse,
  dimPlugSet: DimPlugSet,
  characterId: string
) {
  const availablePlugs = itemsForCharacterOrProfilePlugSet(
    profileResponse,
    dimPlugSet.hash,
    characterId
  );
  return dimPlugSet.plugs.filter((plug) =>
    availablePlugs.some((available) => available.plugItemHash === plug.plugDef.hash)
  );
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
