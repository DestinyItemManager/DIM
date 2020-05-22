import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import _ from 'lodash';
import { clearWishLists } from 'app/wishlists/actions';
import { RootState } from 'app/store/reducers';
import { apiPermissionGrantedSelector } from 'app/dim-api/selectors';
import { initialSettingsState, Settings } from './initial-settings';

export type CharacterOrder = 'mostRecent' | 'mostRecentReverse' | 'fixed' | 'custom';

export const settingsSelector = (state: RootState) =>
  apiPermissionGrantedSelector(state) ? state.dimApi.settings : state.settings;

export function defaultItemSize() {
  return 50;
}

type SettingsAction = ActionType<typeof actions> | ActionType<typeof clearWishLists>;

export const settings: Reducer<Settings, SettingsAction> = (
  state: Settings = initialSettingsState,
  action: SettingsAction
) => {
  switch (action.type) {
    case getType(actions.loaded):
      return {
        ...state,
        ...action.payload,
      };

    case getType(actions.toggleCollapsedSection):
      return {
        ...state,
        collapsedSections: {
          ...state.collapsedSections,
          [action.payload]: !state.collapsedSections[action.payload],
        },
      };

    case getType(actions.setSetting):
      if (state[action.payload.property] !== action.payload.value) {
        return {
          ...state,
          [action.payload.property]: action.payload.value,
        };
      } else {
        return state;
      }

    case getType(actions.setCharacterOrder): {
      const order = action.payload;
      return {
        ...state,
        // Remove these characters from the list and add them, in the new sort order,
        // to the end of the list
        customCharacterSort: state.customCharacterSort
          .filter((id) => !order.includes(id))
          .concat(order),
      };
    }

    // Clearing wish lists also clears the wishListSource setting
    case getType(clearWishLists): {
      return {
        ...state,
        wishListSource: '',
      };
    }

    default:
      return state;
  }
};
