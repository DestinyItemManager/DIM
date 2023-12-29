import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import * as actions from './actions';

// Redux Store Stream Deck State
export interface StreamDeckState {
  // WebSocket status
  readonly enabled: boolean;
  // WebSocket status
  readonly connected: boolean;
  // Authorization
  readonly auth?: actions.StreamDeckAuth;
  // Selection type
  readonly selection?: actions.SelectionType;
}

type StreamDeckAction = ActionType<typeof actions>;

const auth = localStorage.getItem('stream-deck-auth') ?? '';
const enabled = localStorage.getItem('stream-deck-enabled') === 'true';

// initial stream deck store state
const streamDeckInitialState: StreamDeckState = {
  enabled,
  connected: false,
  selection: undefined,
  auth: auth ? (JSON.parse(auth) as actions.StreamDeckAuth) : undefined,
};

export const streamDeck: Reducer<StreamDeckState, StreamDeckAction> = (
  state: StreamDeckState = streamDeckInitialState,
  action: StreamDeckAction,
): StreamDeckState => {
  switch (action.type) {
    case getType(actions.streamDeckConnected):
      return {
        ...state,
        connected: true,
      };
    case getType(actions.streamDeckDisconnected):
      return {
        ...state,
        connected: false,
      };
    case getType(actions.streamDeckSelection):
      return {
        ...state,
        selection: action.payload,
      };
    case getType(actions.streamDeckAuthorization):
      localStorage.setItem('stream-deck-auth', JSON.stringify(action.payload));
      return {
        ...state,
        auth: action.payload,
      };
    case getType(actions.streamDeckEnabled):
      localStorage.setItem('stream-deck-enabled', action.payload.toString());
      return {
        ...state,
        enabled: action.payload,
      };

    default:
      return state;
  }
};
