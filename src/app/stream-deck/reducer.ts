import { StreamDeckAction, StreamDeckState } from 'app/stream-deck/interfaces';
import { Reducer } from 'redux';
import { getType } from 'typesafe-actions';
import * as actions from './actions';

export const streamDeck: Reducer<StreamDeckState, StreamDeckAction> = (
  state: StreamDeckState,
  action: StreamDeckAction
) => {
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
