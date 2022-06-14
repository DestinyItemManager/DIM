import { DeferredPromise } from 'app/stream-deck/util/DeferredPromise';
import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import * as actions from './actions';

export interface StreamDeckState {
  connected: boolean;
  enabled: boolean;
  selectionPromise: DeferredPromise;
  selection?: 'item' | 'loadout' | undefined;
}

export type StreamDeckAction = ActionType<typeof actions>;

const initialState: StreamDeckState = {
  connected: false,
  selectionPromise: new DeferredPromise(),
  enabled: (localStorage.getItem('stream-deck-enabled') || 'false') === 'true',
};

export const streamDeck: Reducer<StreamDeckState, StreamDeckAction> = (
  state: StreamDeckState = initialState,
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
    case getType(actions.streamDeckChangeStatus):
      return {
        ...state,
        enabled: action.payload,
      };

    default:
      return state;
  }
};
