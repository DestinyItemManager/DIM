import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import * as actions from './actions';

// Redux Store Stream Deck State
export interface StreamDeckState {
  // WebSocket status
  readonly connected: boolean;
  // Update popup already showed
  readonly updatePopupShowed: boolean;
  // Selection type
  readonly selection?: 'item' | 'loadout' | 'postmaster' | undefined;
}

type StreamDeckAction = ActionType<typeof actions>;

// initial stream deck store state
const streamDeckInitialState: StreamDeckState = {
  connected: false,
  updatePopupShowed: false,
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
    case getType(actions.streamDeckUpdatePopupShowed):
      return {
        ...state,
        updatePopupShowed: true,
      };
    case getType(actions.streamDeckWaitSelection):
      return {
        ...state,
        selection: action.payload,
      };
    case getType(actions.streamDeckClearSelection):
      return {
        ...state,
        selection: undefined,
      };
    default:
      return state;
  }
};
