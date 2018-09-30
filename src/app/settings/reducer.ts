import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import * as _ from 'underscore';
import { Settings, initialSettingsState } from './settings';

export type SettingsAction = ActionType<typeof actions>;

export const settings: Reducer<Settings, SettingsAction> = (
  state: Settings = initialSettingsState,
  action: SettingsAction
) => {
  switch (action.type) {
    case getType(actions.loaded):
      return {
        ...state,
        ...action.payload,
        farming: {
          ...state.farming,
          ...action.payload.farming
        }
      };

    case getType(actions.toggleCollapsedSection):
      return {
        ...state,
        collapsedSections: {
          ...state.collapsedSections,
          [action.payload]: !state.collapsedSections[action.payload]
        }
      };

    case getType(actions.setSetting):
      if (state[action.payload.property] !== action.payload.value) {
        return {
          ...state,
          [action.payload.property]: action.payload.value
        };
      } else {
        return state;
      }

    case getType(actions.setCharacterOrder):
      const order = action.payload;
      return {
        ...state,
        // Remove these characters from the list and add them, in the new sort order,
        // to the end of the list
        customCharacterSort: state.customCharacterSort
          .filter((id) => !order.includes(id))
          .concat(order)
      };

    default:
      return state;
  }
};
