import { RootState } from 'app/store/types';

export const connectedSelector = (state: RootState) => state.streamDeck.connected;
