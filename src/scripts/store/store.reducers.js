import { createSelector } from 'reselect';
import _ from 'underscore';
import { actionTypes as storeActionTypes } from './store.actions';

const initialState = {
  ids: [],
  stores: {},
  selectedId: null,
  loaded: false
};

const reducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case storeActionTypes.ADD:
      return Object.assign({}, state, {
        ids: [...state.ids, payload.type],
        stores: Object.assign({}, state.stores, { [payload.type]: payload }, { loaded: true })
      });
    case storeActionTypes.ADD_ALL:
      return Object.assign({}, state, {
        ids: [...state.ids, ...payload.map((payload) => payload.id)],
        stores: Object.assign({}, state.stores, _.object(_.map(payload, (store) => [store.id, store]))),
        loaded: true
      });
    case storeActionTypes.REMOVE_ALL:
      return Object.assign({}, initialState, { loaded: true });
    default:
      return state;
  }
};

export const getStores = (state) => state.stores;

export const getIds = (state) => state.ids;

export const getSelectedId = (state) => state.selectedId;

export const getSelected = createSelector(getStores, getSelectedId, (stores, selectedId) => {
  return stores[selectedId];
});

export const getAll = createSelector(getStores, getIds, (stores, ids) => {
  return ids.map((id) => stores[id]);
});

export default reducer;