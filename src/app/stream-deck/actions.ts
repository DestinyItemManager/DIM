import { StreamDeckSelectionType } from 'app/stream-deck/interfaces';
import { createAction } from 'typesafe-actions';

/**
 * Change WebSocket status to connected (true)
 */
export const streamDeckConnected = createAction('stream-deck/CONNECTED')();

/**
 * Change WebSocket status to disconnected (false)
 */
export const streamDeckDisconnected = createAction('stream-deck/DISCONNECTED')();

/**
 * Set the update popup as already showed
 */
export const streamDeckUpdatePopupShowed = createAction('stream-deck/UPDATE-POPUP')();

/**
 * Trigger a notification popup asking the user to select an item/loadout
 */
export const streamDeckWaitSelection = createAction(
  'shell/TRIGGER_SELECTION',
  (selectionType: StreamDeckSelectionType) => selectionType
)();

/**
 * Cancel selection notification and stop related components behavior
 */
export const streamDeckClearSelection = createAction('stream-deck/CANCEL_SELECTION')();
