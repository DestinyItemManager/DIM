import { createAction } from 'typesafe-actions';

export type SelectionType = 'item' | 'loadout' | 'postmaster' | undefined;

/**
 * Change WebSocket status to connected (true)
 */
export const streamDeckConnected = createAction('stream-deck/CONNECTED')();

/**
 * Change WebSocket status to disconnected (false)
 */
export const streamDeckDisconnected = createAction('stream-deck/DISCONNECTED')();

/**
 * Update the selection type
 */
export const streamDeckSelection = createAction('stream-deck/SELECTION')<SelectionType>();
