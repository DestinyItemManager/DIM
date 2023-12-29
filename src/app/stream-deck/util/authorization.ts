import { ThunkResult } from 'app/store/types';
import { startStreamDeckConnection, stopStreamDeckConnection } from '../stream-deck';

const STREAM_DECK_DEEP_LINK = 'streamdeck://plugins/message/com.dim.streamdeck';

interface StreamDeckAuth {
  instance: string;
  token: string;
}

export const streamDeckAuth = () => {
  const auth = localStorage.getItem('stream-deck-auth') ?? '';
  return auth ? (JSON.parse(auth) as StreamDeckAuth) : undefined;
};

export const setStreamDeckAuth = (auth: StreamDeckAuth) => {
  localStorage.setItem('stream-deck-auth', JSON.stringify(auth));
  document.dispatchEvent(new Event('stream-deck-auth-update'));
};

export function streamDeckAuthorizationInit(): ThunkResult {
  return async (dispatch) => {
    dispatch(stopStreamDeckConnection());
    const auth = {
      instance: window.crypto.randomUUID(),
      token: window.crypto.randomUUID(),
    };
    setStreamDeckAuth(auth);
    const query = new URLSearchParams(auth).toString();
    window.open(`${STREAM_DECK_DEEP_LINK}/connect?${query}`);
    dispatch(startStreamDeckConnection());
  };
}
