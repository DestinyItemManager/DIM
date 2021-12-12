import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';

/**
 * Get all plugs from the specified plugset. This includes whether the plugs are unlocked or not.
 * This returns the specified plugset no matter where it lives.
 * @deprecated try to ask for a specific character or profile-wide
 */
export function itemsForPlugSetEverywhere(
  profileResponse: DestinyProfileResponse,
  plugSetHash: number
) {
  return (profileResponse.profilePlugSets.data?.plugs[plugSetHash] || []).concat(
    Object.values(profileResponse.characterPlugSets.data || {})
      .filter((d) => d.plugs?.[plugSetHash])
      .flatMap((d) => d.plugs[plugSetHash])
  );
}

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
