import { DeferredPromise } from 'app/stream-deck/util/deferred';
import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import * as actions from './actions';

export interface StreamDeckState {
  // WebSocket status
  readonly connected: boolean;
  // Deferred promise used with selections notifications and actions
  readonly selectionPromise: DeferredPromise;
  // Selection type
  readonly selection?: 'item' | 'loadout' | 'postmaster' | undefined;
}

export type StreamDeckAction = ActionType<typeof actions>;

export const initialState: StreamDeckState = {
  connected: false,
  selectionPromise: new DeferredPromise(),
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
    default:
      return state;
  }
};
