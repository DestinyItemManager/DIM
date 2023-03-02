import { profileResponseSelector } from 'app/inventory/selectors';
import { convertDestinyLoadoutComponentToInGameLoadout } from 'app/loadout-drawer/loadout-type-converters';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import _ from 'lodash';
import { createSelector } from 'reselect';

/** All loadouts supported directly by D2 (post-Lightfall), on any character */
export const allInGameLoadoutsSelector = createSelector(
  d2ManifestSelector,
  (state: RootState) => profileResponseSelector(state)?.characterLoadouts?.data,
  (defs, loadouts): InGameLoadout[] =>
    defs && loadouts
      ? Object.entries(loadouts).flatMap(([characterId, c]) =>
          _.compact(
            c.loadouts.map((l, i) =>
              convertDestinyLoadoutComponentToInGameLoadout(l, i, characterId, defs)
            )
          )
        )
      : emptyArray<InGameLoadout>()
);

/** Loadouts supported directly by D2 (post-Lightfall), for a specific character */
export const inGameLoadoutsForCharacterSelector = createSelector(
  d2ManifestSelector,
  (state: RootState) => profileResponseSelector(state)?.characterLoadouts?.data,
  (_state: RootState, characterId: string) => characterId,
  (defs, loadouts, characterId): InGameLoadout[] =>
    (defs &&
      _.compact(
        loadouts?.[characterId]?.loadouts.map((l, i) =>
          convertDestinyLoadoutComponentToInGameLoadout(l, i, characterId, defs)
        )
      )) ??
    emptyArray<InGameLoadout>()
);
