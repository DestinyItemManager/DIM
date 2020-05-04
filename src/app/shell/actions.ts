import { createAction } from 'typesafe-actions';

/** Set whether we're in phonePortrait view mode. */
export const setPhonePortrait = createAction('shell/PHONE_PORTRAIT')<boolean>();

/**
 * Set the current search query text. Only the search filter input component should set
 * doNotUpdateVersion - all other uses should ignore that parameter.
 */
export const setSearchQuery = createAction(
  'shell/SEARCH_QUERY',
  (query: string, doNotUpdateVersion?: boolean) => ({ query, doNotUpdateVersion })
)();

/**
 * Toggle in or out a specific search query component from the existing search.
 */
export const toggleSearchQueryComponent = createAction('shell/TOGGLE_SEARCH_QUERY_COMPONENT')<
  string
>();

/**
 * Signifies that there is a page-wide loading state, with a message.
 * These shouldn't be used directly - use loadingStart and loadingEnd.
 */
export const loadingStart = createAction('shell/LOADING')<string>();
export const loadingEnd = createAction('shell/LOADING_DONE')<string>();
