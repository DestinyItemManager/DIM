import { GlobalAlert } from 'bungie-api-ts/core';
import { createAction } from 'typesafe-actions';

/** Set whether we're in phonePortrait view mode. */
export const setPhonePortrait = createAction('shell/PHONE_PORTRAIT')<boolean>();

/**
 * Set the current search query text. Only the search filter input component should set
 * updateVersion - all other uses should ignore that parameter.
 */
export const setSearchQuery = createAction(
  'shell/SEARCH_QUERY',
  // Another lint auto-fixes this by removing :boolean, then thinks `updateVersion` is `any`
  // eslint-disable-next-line
  (query: string, updateVersion: boolean = true) => ({
    query,
    updateVersion,
  }),
)();

/**
 * Toggle in or out a specific search query component from the existing search.
 */
export const toggleSearchQueryComponent = createAction(
  'shell/TOGGLE_SEARCH_QUERY_COMPONENT',
)<string>();

export const toggleSearchResults = createAction(
  'shell/TOGGLE_SEARCH_RESULTS',
  (open?: boolean) => open,
)();

/**
 * Set the current location path
 */
export const setRouterLocation = createAction(
  'shell/SET_ROUTER_LOCATION',
  (location?: string) => location,
)();

/**
 * Reset the current location path
 */
export const resetRouterLocation = createAction('shell/RESET_ROUTER_LOCATION')();

/**
 * Update the known list of Bungie.net alerts.
 */
export const updateBungieAlerts = createAction('shell/BUNGIE_ALERTS')<GlobalAlert[]>();

/**
 * Signifies that there is a page-wide loading state, with a message.
 * These shouldn't be used directly - use loadingStart and loadingEnd.
 */
export const loadingStart = createAction('shell/LOADING')<string>();
export const loadingEnd = createAction('shell/LOADING_DONE')<string>();
