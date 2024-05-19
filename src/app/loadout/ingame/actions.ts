import { InGameLoadout } from 'app/loadout/loadout-types';
import { createAction } from 'typesafe-actions';

/**
 * When a loadout is cleared/deleted.
 */
export const inGameLoadoutLoaded = createAction('ingame_loadout/LOADED')<{
  [characterId: string]: InGameLoadout[];
}>();

/**
 * When a loadout is cleared/deleted.
 */
export const inGameLoadoutDeleted = createAction('ingame_loadout/DELETED')<InGameLoadout>();

/**
 * When a loadout has its name/color/icon updated.
 */
export const inGameLoadoutUpdated = createAction('ingame_loadout/UPDATED')<InGameLoadout>();
