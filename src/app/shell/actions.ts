import { createAction } from 'typesafe-actions';

/** Set whether we're in phonePortrait view mode. */
export const setPhonePortrait = createAction('shell/PHONE_PORTRAIT')<boolean>();

/** Set the current search query text. */
export const setSearchQuery = createAction('shell/SEARCH_QUERY')<string>();
