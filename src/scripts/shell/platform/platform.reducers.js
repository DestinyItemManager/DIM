import { createSelector } from 'reselect';
import { actionTypes as platformActionTypes } from './platform.actions';

const initialState = {
  ids: [],
  platforms: {},
  selectedId: null,
  loaded: false
};

const reducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case platformActionTypes.LOAD:
      return Object.assign({}, state, { loaded: true });
    case platformActionTypes.ADD:
      if (payload.type) {
        return Object.assign({}, state, {
          ids: [...state.ids, payload.type],
          platforms: Object.assign({}, state.platforms, { [payload.type]: payload })
        });
      }

      return state;
    case platformActionTypes.SET_SELECTED:
      if (payload.label) {
        return Object.assign({}, state, { selectedId: payload.type });
      }

      return state;
    default:
      return state;
  }
};

export const getPlatforms = (state) => state.platforms;

export const getIds = (state) => state.ids;

export const getSelectedId = (state) => state.selectedId;

export const getSelected = createSelector(getPlatforms, getSelectedId, (platforms, selectedId) => {
  return platforms[selectedId];
});

export const getAll = createSelector(getPlatforms, getIds, (platforms, ids) => {
  return ids.map((id) => platforms[id]);
});

export default reducer;