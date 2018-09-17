import { createStandardAction } from 'typesafe-actions';

/** Set whether we're in phonePortrait view mode. */
export const setPhonePortrait = createStandardAction('shell/PHONE_PORTRAIT')<boolean>();

/** Set the current search query text. */
export const setSearchQuery = createStandardAction('shell/SEARCH_QUERY')<string>();
