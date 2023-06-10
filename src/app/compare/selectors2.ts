import { RootState } from 'app/store/types';

// Look these circular selector imports are getting ridiculous

/**
 * The current compare session settings.
 */
export const compareSessionSelector = (state: RootState) => state.compare.session;

export const compareOpenSelector = (state: RootState) => Boolean(compareSessionSelector(state));
