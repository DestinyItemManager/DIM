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
