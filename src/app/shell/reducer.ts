import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { isPhonePortraitFromMediaQuery } from '../utils/media-queries';
import { RootState } from '../store/reducers';

export const querySelector = (state: RootState) => state.shell.searchQuery;
export const searchQueryVersionSelector = (state: RootState) => state.shell.searchQueryVersion;

export interface ShellState {
  readonly isPhonePortrait: boolean;
  readonly searchQuery: string;
  /**
   * This is a workaround for the fact that our search query input is debounced. When setting the
   * query text from outside of the search input, this version will be updated, which tells the
   * search input component to reset its internal state. Otherwise if we listened to every
   * change of the search query text, your typing would be undone when the redux store updates.
   */
  readonly searchQueryVersion: number;
}

export type ShellAction = ActionType<typeof actions>;

const initialState: ShellState = {
  isPhonePortrait: isPhonePortraitFromMediaQuery(),
  searchQuery: '',
  searchQueryVersion: 0
};

export const shell: Reducer<ShellState, ShellAction> = (
  state: ShellState = initialState,
  action: ShellAction
) => {
  switch (action.type) {
    case getType(actions.setPhonePortrait):
      return {
        ...state,
        isPhonePortrait: action.payload
      };
    case getType(actions.setSearchQuery):
      return {
        ...state,
        searchQuery: action.payload.query,
        searchQueryVersion: action.payload.doNotUpdateVersion
          ? state.searchQueryVersion
          : state.searchQueryVersion + 1
      };

    case getType(actions.toggleSearchQueryComponent): {
      const existingQuery = state.searchQuery;
      const queryComponent = action.payload.trim();
      const newQuery = existingQuery.includes(queryComponent)
        ? existingQuery.replace(queryComponent, '').replace(/\s+/, ' ')
        : `${existingQuery} ${queryComponent}`;

      return {
        ...state,
        searchQuery: newQuery,
        searchQueryVersion: state.searchQueryVersion + 1
      };
    }

    default:
      return state;
  }
};
