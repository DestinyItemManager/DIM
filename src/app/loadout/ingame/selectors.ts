import { profileResponseSelector } from 'app/inventory/selectors';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { createSelector } from 'reselect';

const inGameLoadoutsSelector = (state: RootState) => state.inGameLoadouts.loadouts;
const characterLoadoutsSelector = (state: RootState) =>
  profileResponseSelector(state)?.characterLoadouts?.data;

/** All loadouts supported directly by D2 (post-Lightfall), on any character */
export const allInGameLoadoutsSelector = createSelector(
  inGameLoadoutsSelector,
  (loadouts): InGameLoadout[] => Object.values(loadouts).flat()
);

/** Loadouts supported directly by D2 (post-Lightfall), for a specific character */
export const inGameLoadoutsForCharacterSelector = createSelector(
  inGameLoadoutsSelector,
  (_state: RootState, characterId: string) => characterId,
  (loadouts, characterId): InGameLoadout[] => loadouts[characterId] ?? emptyArray<InGameLoadout>()
);

/**
 * How many loadout slots has the user unlocked? We get this directly from the profile because we
 * want to count all loadouts, even the empty ones.
 */
export const availableLoadoutSlotsSelector = createSelector(characterLoadoutsSelector, (loadouts) =>
  loadouts ? Object.values(loadouts)[0]?.loadouts.length ?? 0 : 0
);
