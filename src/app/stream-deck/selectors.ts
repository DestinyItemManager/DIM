import { RootState } from 'app/store/types';

export const streamDeckConnectedSelector = (state: RootState) => state.streamDeck.connected;

export const streamDeckUpdatePopupSelector = (state: RootState) =>
  state.streamDeck.updatePopupShowed;

export const streamDeckSelectionSelector = (state: RootState) => state.streamDeck.selection;
