import { createAction } from 'typesafe-actions';
import { Loadout } from './loadout-types';

/** Bulk update loadouts after they've been loaded. */
export const loaded = createAction('loadouts/LOADED')<Loadout[]>();

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
