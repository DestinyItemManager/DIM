import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import * as actions from './actions';

// Redux Store Stream Deck State
export interface StreamDeckState {
  // WebSocket status
  readonly connected: boolean;
  // Selection type
  readonly selection?: actions.SelectionType;
}

type StreamDeckAction = ActionType<typeof actions>;

// initial stream deck store state
const streamDeckInitialState: StreamDeckState = {
  connected: false,
  selection: undefined,
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

    default:
      return state;
  }
};
