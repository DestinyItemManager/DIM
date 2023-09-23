import { currentProfileSelector } from 'app/dim-api/selectors';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { isClassCompatible } from 'app/utils/item-utils';
import { currySelector } from 'app/utils/selector-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { createSelector } from 'reselect';
import { convertDimApiLoadoutToLoadout } from './loadout-type-converters';
import { Loadout } from './loadout-types';
import {
  FragmentProblem,
  getFragmentProblemsSelector,
  hasDeprecatedMods,
  isMissingItemsSelector,
} from './loadout-utils';

// had to pull this out to another file because things got weird :(

/** All loadouts relevant to the current account */
export const loadoutsSelector = createSelector(
  (state: RootState) => currentProfileSelector(state)?.loadouts,
  (loadouts) =>
    loadouts
      ? Object.values(loadouts).map((loadout) => convertDimApiLoadoutToLoadout(loadout))
      : emptyArray<Loadout>()
);

interface LoadoutIssues {
  hasMissingItems: boolean;
  hasDeprecatedMods: boolean;
  emptyFragmentSlots: boolean;
  tooManyFragments: boolean;
}

/**
 * notable loadout issues, keyed by loadout ID.
 *
 * this is for flagging loadouts,
 * so it only checks fragment issues according to the Aspects specified by the loadout
 */
export const loadoutIssuesSelector = createSelector(
  loadoutsSelector,
  getFragmentProblemsSelector,
  isMissingItemsSelector,
  d2ManifestSelector,
  (loadouts, fragmentProblemChecker, missingItemChecker, d2defs) => {
    const issues: NodeJS.Dict<LoadoutIssues> = {};
    for (const loadout of loadouts) {
      const fragmentProblem = fragmentProblemChecker(undefined, loadout);
      issues[loadout.id] = {
        hasMissingItems: missingItemChecker(undefined, loadout),
        hasDeprecatedMods: Boolean(d2defs && hasDeprecatedMods(loadout, d2defs)),
        emptyFragmentSlots: fragmentProblem === FragmentProblem.EmptyFragmentSlots,
        tooManyFragments: fragmentProblem === FragmentProblem.TooManyFragments,
      };
    }
    return issues;
  }
);

/** All loadouts for a particular class type */
export const loadoutsForClassTypeSelector = currySelector(
  createSelector(
    loadoutsSelector,
    (_state: RootState, classType: DestinyClass) => classType,
    (loadouts, classType) =>
      loadouts.filter((loadout) => isClassCompatible(classType, loadout.classType))
  )
);
