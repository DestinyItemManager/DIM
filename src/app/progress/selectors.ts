import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';

/**
 * get DestinyCharacterActivitiesComponent from a DestinyProfileResponse.
 * if no character ID is specified, uses the "first" one in the character list
 */
export const getCharacterActivities = (
  profileResponse: DestinyProfileResponse | undefined,
  characterId?: string,
) => {
  characterId ??= profileResponse?.characterActivities?.data
    ? Object.keys(profileResponse.characterActivities.data)[0]
    : '';

  return profileResponse?.characterActivities?.data?.[characterId];
};

/**
 * get DestinyCharacterProgressionComponent from a DestinyProfileResponse.
 * if no character ID is specified, uses the "first" one in the character list
 */
export const getCharacterProgressions = (
  profileResponse: DestinyProfileResponse | undefined,
  characterId?: string,
) => {
  // try to fill in missing character ID with a valid value
  characterId ??= profileResponse?.characterProgressions?.data
    ? Object.keys(profileResponse.characterProgressions.data)[0]
    : '';
  return profileResponse?.characterProgressions?.data?.[characterId];
};
