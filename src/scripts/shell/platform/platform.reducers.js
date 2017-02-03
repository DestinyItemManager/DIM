import { actionTypes as platformActionTypes } from './platform.actions';

const initialPlatformsState = {
  ids: [],
  platforms: {},
  selected: null,
  loaded: false
};

const reducer = (state = initialPlatformsState, { type, payload }) => {
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
        return Object.assign({}, state, { selected: payload.type });
      }

      return state;
    default:
      return state;
  }
};

export default reducer;