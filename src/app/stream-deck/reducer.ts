import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import * as actions from './actions';

// Redux Store Stream Deck State
export interface StreamDeckState {
  readonly setupOpen: boolean;
  readonly checking: boolean;
  readonly approvalRequired: boolean;
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

const savedAuth = localStorage.getItem('stream-deck-auth');
const auth = savedAuth ? (JSON.parse(savedAuth) as actions.StreamDeckAuth) : undefined;
const enabled = localStorage.getItem('stream-deck-enabled') === 'true';

// initial stream deck store state
const streamDeckInitialState: StreamDeckState = {
  enabled,
  checking: enabled,
  approvalRequired: !auth?.instance || !auth.token,
  setupOpen: false,
  connected: false,
  selection: undefined,
  auth,
};

export const streamDeck: Reducer<StreamDeckState, StreamDeckAction> = (
  state: StreamDeckState = streamDeckInitialState,
  action: StreamDeckAction,
): StreamDeckState => {
  switch (action.type) {
    case getType(actions.streamDeckChecking):
      return { ...state, checking: true, approvalRequired: true };
    case getType(actions.streamDeckApprovalRequired):
      return { ...state, checking: false, approvalRequired: action.payload };
    case getType(actions.streamDeckSetup):
      return { ...state, setupOpen: action.payload };
    case getType(actions.streamDeckConnected):
      return {
        ...state,
        connected: true,
        checking: true,
        approvalRequired: true,
      };
    case getType(actions.streamDeckDisconnected):
      return {
        ...state,
        connected: false,
        checking: false,
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
        approvalRequired: true,
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
