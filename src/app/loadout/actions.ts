import { createStandardAction } from 'typesafe-actions';
import { Loadout } from './loadout.service';

/** Bulk update loadouts after they've been loaded. */
export const loaded = createStandardAction('loadouts/LOADED')<Loadout[]>();

/** Delete a loadout by ID */
export const deleteLoadout = createStandardAction('loadouts/DELETE')<string>();

/** Update or add a loadout */
export const updateLoadout = createStandardAction('loadouts/UPDATE')<Loadout>();

/** Archive a loadout so we can undo it */
export const savePreviousLoadout = createStandardAction('loadouts/SAVE_PREVIOUS')<{
  storeId: string;
  loadoutId: string;
  previousLoadout: Loadout;
}>();
