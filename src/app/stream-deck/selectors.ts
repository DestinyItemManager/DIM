import { RootState } from 'app/store/types';

export const streamDeckSelector = (state: RootState) => state.streamDeck;

export const streamDeckEnabledSelector = (state: RootState) => state.streamDeck.enabled;

export const streamDeckSelectionSelector = (state: RootState) => state.streamDeck.selection;
