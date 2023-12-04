import { GlobalAlert } from 'bungie-api-ts/core';
import { deepEqual } from 'fast-equals';
import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import { isPhonePortraitFromMediaQuery } from '../utils/media-queries';
import * as actions from './actions';

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

  /**
   * Whether the detailed search results drawer is open. The logic for this is
   * a bit tricky and needs to be shared between a few components.
   */
  readonly searchResultsOpen: boolean;

  /** Global, page-covering loading state. */
  readonly loadingMessages: string[];

  /** BrowserRouter custom location  */
  readonly routerLocation?: string;

  readonly bungieAlerts: GlobalAlert[];
}

export type ShellAction = ActionType<typeof actions>;

const initialState: ShellState = {
  isPhonePortrait: isPhonePortraitFromMediaQuery(),
  searchQuery: '',
  searchQueryVersion: 0,
  searchResultsOpen: false,
  loadingMessages: [],
  routerLocation: '',
  bungieAlerts: [],
};

export const shell: Reducer<ShellState, ShellAction> = (
  state: ShellState = initialState,
  action: ShellAction,
): ShellState => {
  switch (action.type) {
    case getType(actions.setPhonePortrait):
      return {
        ...state,
        isPhonePortrait: action.payload,
      };
    case getType(actions.setSearchQuery): {
      const { query, updateVersion } = action.payload;
      if (query === undefined) {
        throw new Error('undefined query');
      }
      return query !== state.searchQuery
        ? {
            ...state,
            searchQuery: query,
            searchQueryVersion: updateVersion
              ? state.searchQueryVersion + 1
              : state.searchQueryVersion,
            searchResultsOpen:
              (query && state.searchResultsOpen) ||
              Boolean(state.isPhonePortrait && !state.searchQuery && query),
          }
        : state;
    }

    case getType(actions.toggleSearchQueryComponent): {
      const existingQuery = state.searchQuery;
      const queryComponent = action.payload.trim();
      const newQuery = existingQuery.includes(queryComponent)
        ? existingQuery.replace(queryComponent, '')
        : `${existingQuery} ${queryComponent}`;

      return {
        ...state,
        searchQuery: newQuery.replace(/\s+/, ' ').trim(),
        searchQueryVersion: state.searchQueryVersion + 1,
      };
    }

    case getType(actions.toggleSearchResults): {
      return {
        ...state,
        searchResultsOpen: action.payload ?? !state.searchResultsOpen,
      };
    }

    case getType(actions.loadingStart): {
      return {
        ...state,
        loadingMessages: [...new Set([...state.loadingMessages, action.payload])],
      };
    }

    case getType(actions.loadingEnd): {
      return {
        ...state,
        loadingMessages: state.loadingMessages.filter((m) => m !== action.payload),
      };
    }

    case getType(actions.updateBungieAlerts): {
      return deepEqual(state.bungieAlerts, action.payload)
        ? state
        : { ...state, bungieAlerts: action.payload };
    }

    case getType(actions.setRouterLocation): {
      return {
        ...state,
        routerLocation: action.payload,
      };
    }

    case getType(actions.resetRouterLocation): {
      return {
        ...state,
        routerLocation: undefined,
      };
    }

    default:
      return state;
  }
};
