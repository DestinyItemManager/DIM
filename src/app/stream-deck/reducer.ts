import { StreamDeckAction, StreamDeckState } from 'app/stream-deck/interfaces';
import { Reducer } from 'redux';
import { getType } from 'typesafe-actions';
import * as actions from './actions';
import { streamDeckInitialState } from './stream-deck';

export const streamDeck: Reducer<StreamDeckState, StreamDeckAction> = (
  state: StreamDeckState = streamDeckInitialState,
  action: StreamDeckAction
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
