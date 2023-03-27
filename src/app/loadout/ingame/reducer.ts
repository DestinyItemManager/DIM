import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { ActionType, getType, Reducer } from 'typesafe-actions';
import * as actions from './actions';

export interface InGameLoadoutState {
  /**
   * While ingame loadouts are generally driven from the profile state, we store their transformed
   * versions in our own state so that we can modify them in place without having to refresh after
   * each change. Each character has a different list of loadouts.
   */
  readonly loadouts: { [characterId: string]: InGameLoadout[] };
}

export type InGameLoadoutAction = ActionType<typeof actions>;

const initialState: InGameLoadoutState = {
  loadouts: {},
};

export const inGameLoadouts: Reducer<InGameLoadoutState, InGameLoadoutAction> = (
  state: InGameLoadoutState = initialState,
  action
) => {
  switch (action.type) {
    case getType(actions.inGameLoadoutLoaded):
      return {
        ...state,
        loadouts: action.payload,
      };

    case getType(actions.inGameLoadoutDeleted): {
      const { characterId, index } = action.payload;
      return {
        ...state,
        loadouts: {
          [characterId]: state.loadouts[characterId]?.filter((l) => l.index !== index) ?? [],
        },
      };
    }

    case getType(actions.inGameLoadoutUpdated): {
      const loadout = action.payload;
      return {
        ...state,
        loadouts: {
          [loadout.characterId]: state.loadouts[loadout.characterId]?.map((l) =>
            l.index === loadout.index ? loadout : l
          ),
        },
      };
    }

    default:
      return state;
  }
};
