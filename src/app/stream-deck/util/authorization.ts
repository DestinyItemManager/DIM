import { ThunkResult } from 'app/store/types';
import { streamDeckAuthorization } from '../actions';
import { startStreamDeckConnection, stopStreamDeckConnection } from '../stream-deck';

const STREAM_DECK_DEEP_LINK = 'streamdeck://plugins/message/com.dim.streamdeck';

export function streamDeckAuthorizationInit(): ThunkResult {
  return async (dispatch) => {
    dispatch(stopStreamDeckConnection());
    const auth = {
      instance: window.crypto.randomUUID(),
      token: window.crypto.randomUUID(),
    };
    dispatch(streamDeckAuthorization(auth));
    const query = new URLSearchParams(auth).toString();
    window.open(`${STREAM_DECK_DEEP_LINK}/connect?${query}`);
    dispatch(startStreamDeckConnection());
  };
}
