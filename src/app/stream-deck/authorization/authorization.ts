import { showStreamDeckAuthorizationNotification } from 'app/stream-deck/authorization/AuthorizationNotification';
import { DIM_VERIFICATION, streamDeckDecrypt } from 'app/stream-deck/authorization/encryption';
import { StreamDeckMessage, StreamDeckState } from 'app/stream-deck/interfaces';
import {
  clientIdentifier,
  setClientIdentifier,
  setStreamDeckSharedKey,
  streamDeckSharedKey,
} from 'app/stream-deck/util/local-storage';

// check stream deck WS authorization and decrypt message if token exists
export const checkAuthorization = (
  data: string,
  state: StreamDeckState,
  ws: WebSocket
): StreamDeckMessage | undefined => {
  if (data.startsWith(DIM_VERIFICATION)) {
    const [challenge, sharedKey] = data.slice(DIM_VERIFICATION.length).split(':');
    const promise = state.selectionPromise;
    showStreamDeckAuthorizationNotification(
      parseInt(challenge),
      promise,
      () => {
        ws.send(`dim://auth:${sharedKey}`);
        setStreamDeckSharedKey(sharedKey);
        promise.resolve();
      },
      () => {
        promise.resolve();
      }
    );
    return;
  }

  try {
    const decrypted = streamDeckDecrypt(data, streamDeckSharedKey());
    return JSON.parse(decrypted);
  } catch (e) {
    return;
  }
};

// generate random client identifier
export const generateIdentifier = () => {
  if (!clientIdentifier()) {
    setClientIdentifier(Math.random().toString(36).slice(2));
  }
};
