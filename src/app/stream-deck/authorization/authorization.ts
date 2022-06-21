import { streamDeckWebSocket } from 'app/stream-deck/actions';
import { showStreamDeckAuthorizationNotification } from 'app/stream-deck/authorization/AuthorizationNotification';
import encryption, { DIM_VERIFICATION } from 'app/stream-deck/authorization/encryption';
import { StreamDeckMessage } from 'app/stream-deck/interfaces';
import { StreamDeckState } from 'app/stream-deck/reducer';
import { streamDeckLocal } from 'app/stream-deck/util/local-storage';

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
        streamDeckLocal.setSharedKey(sharedKey);
        promise.resolve();
      },
      () => {
        promise.resolve();
      }
    );
    return;
  }

  try {
    const decrypted = encryption.decrypt(data, streamDeckLocal.sharedKey());
    return JSON.parse(decrypted);
  } catch (e) {
    return;
  }
};

// generate random client identifier
export const generateIdentifier = () => {
  if (!streamDeckLocal.identifier()) {
    streamDeckLocal.setIdentifier(Math.random().toString(36).slice(2));
  }
};

// reset authorization token and regenerate client identifier
export const resetStreamDeckAuthorization = () => {
  streamDeckWebSocket.send(`dim://reset:${streamDeckLocal.identifier()}`);
  streamDeckLocal.removeIdentifier();
  streamDeckLocal.removeSharedKey();
  generateIdentifier();
};
