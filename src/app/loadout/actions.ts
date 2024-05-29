import { createAction } from 'typesafe-actions';
import { Loadout } from './loadout-types';

/** Delete a loadout by ID */
export const deleteLoadout = createAction('loadouts/DELETE')<string>();

/** Update or add a loadout */
export const updateLoadout = createAction('loadouts/UPDATE')<Loadout>();

/** Archive a loadout so we can undo it */
export const savePreviousLoadout = createAction('loadouts/SAVE_PREVIOUS')<{
  storeId: string;
  loadoutId: string;
  previousLoadout: Loadout;
}>();

/** Updates the store in use on the loadout page */
export const updateLoadoutStore = createAction('loadouts/UPDATE_STORE')<{
  storeId: string | undefined;
}>();
