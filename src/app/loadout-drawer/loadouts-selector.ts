import { currentProfileSelector } from 'app/dim-api/selectors';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { isClassCompatible } from 'app/utils/item-utils';
import { currySelector } from 'app/utils/selectors';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { createSelector } from 'reselect';
import { convertDimApiLoadoutToLoadout } from './loadout-type-converters';
import { Loadout } from './loadout-types';

// had to pull this out to another file because things got weird :(

/** All loadouts relevant to the current account */
export const loadoutsSelector = createSelector(
  (state: RootState) => currentProfileSelector(state)?.loadouts,
  (loadouts) =>
    loadouts
      ? Object.values(loadouts).map((loadout) => convertDimApiLoadoutToLoadout(loadout))
      : emptyArray<Loadout>(),
);

/** All loadouts for a particular class type */
export const loadoutsForClassTypeSelector = currySelector(
  createSelector(
    loadoutsSelector,
    (_state: RootState, classType: DestinyClass) => classType,
    (loadouts, classType) =>
      loadouts.filter((loadout) => isClassCompatible(classType, loadout.classType)),
  ),
);
