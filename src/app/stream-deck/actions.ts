import { createAction } from 'typesafe-actions';

export type SelectionType = 'item' | 'loadout' | 'inventory-item' | 'postmaster' | undefined;

export interface StreamDeckAuth {
  instance: string;
  token: string;
}

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

/**
 * Update the authorization
 */
export const streamDeckAuthorization = createAction('stream-deck/AUTHORIZATION')<StreamDeckAuth>();

/**
 * Update the plugin status
 */
export const streamDeckEnabled = createAction('stream-deck/ENABLED')<boolean>();
