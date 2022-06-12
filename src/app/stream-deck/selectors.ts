import { RootState } from 'app/store/types';

export const streamDeckConnectedSelector = (state: RootState) => state.streamDeck.connected;

export const streamDeckEnabledSelector = (state: RootState) => state.streamDeck.enabled;
