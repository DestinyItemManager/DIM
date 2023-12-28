import { RootState } from 'app/store/types';

export const streamDeckSelector = (state: RootState) => state.streamDeck;

export const streamDeckConnectedSelector = (state: RootState) => state.streamDeck.connected;

export const streamDeckSelectionSelector = (state: RootState) => state.streamDeck.selection;

export const rootStateSelector = (state: RootState) => state;
