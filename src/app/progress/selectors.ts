import { profileResponseSelector, sortedStoresSelector } from 'app/inventory-stores/selectors';
import { getCurrentStore } from 'app/inventory-stores/stores-helpers';
import { RootState } from 'app/store/types';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';

/**
 * get DestinyCharacterProgressionComponent from a DestinyProfileResponse.
 * if no character ID is specified, uses the "first" one in the character list
 */
export const getCharacterProgressions = (
  profileResponse: DestinyProfileResponse | undefined,
  characterId?: string
) => {
  // try to fill in missing character ID with a valid value
  characterId =
    characterId ||
    (profileResponse?.characterProgressions?.data
      ? Object.keys(profileResponse.characterProgressions.data)[0]
      : '');
  return profileResponse?.characterProgressions?.data?.[characterId];
};

/**
 * get the DestinyCharacterProgressionComponent for a character.
 * if no character ID is specified, uses the CurrentStore (last known played)
 */
export const characterProgressionsSelector = (characterId?: string) => (state: RootState) => {
  characterId = characterId || getCurrentStore(sortedStoresSelector(state))?.id;
  return getCharacterProgressions(profileResponseSelector(state), characterId);
};
