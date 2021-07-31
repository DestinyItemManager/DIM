import { getGlobalAlerts } from 'app/bungie-api/bungie-core-api';
import { ThunkResult } from 'app/store/types';
import { errorLog } from 'app/utils/log';
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
  (query: string, updateVersion = true) => ({ query, updateVersion })
)();

/**
 * Toggle in or out a specific search query component from the existing search.
 */
export const toggleSearchQueryComponent = createAction(
  'shell/TOGGLE_SEARCH_QUERY_COMPONENT'
)<string>();

export const toggleSearchResults = createAction(
  'shell/TOGGLE_SEARCH_RESULTS',
  (open?: boolean) => open
)();

/**
 * Update the known list of Bungie.net alerts.
 */
export const updateBungieAlerts = createAction('shell/BUNGIE_ALERTS')<GlobalAlert[]>();

/**
 * Poll repeatedly for new Bungie alerts
 */
export function pollForBungieAlerts(): ThunkResult {
  return async (dispatch) => {
    setInterval(async () => {
      try {
        dispatch(updateBungieAlerts(await getGlobalAlerts()));
      } catch (e) {
        errorLog('BungieAlerts', 'Unable to get Bungie.net alerts: ', e);
      }
    }, 10 * 60 * 1000);
  };
}

/**
 * Signifies that there is a page-wide loading state, with a message.
 * These shouldn't be used directly - use loadingStart and loadingEnd.
 */
export const loadingStart = createAction('shell/LOADING')<string>();
export const loadingEnd = createAction('shell/LOADING_DONE')<string>();
