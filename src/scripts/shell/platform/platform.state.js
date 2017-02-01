export const GET_PLATFORMS = 'GET_PLATFORMS';
export const CREATE_PLATFORM = 'CREATE_PLATFORM';
export const UPDATE_PLATFORM = 'UPDATE_PLATFORM';
export const DELETE_PLATFORM = 'DELETE_PLATFORM';
export const GET_SELECTED_PLATFORM = 'GET_SELECTED_PLATFORM';
export const RESET_SELECTED_PLATFORM = 'RESET_SELECTED_PLATFORM';

export const PlatformsActions = ($ngRedux, $q, dimPlatformService, loadingTracker) => {
  'ngInject';

  // const extract = (result) => result.data;

  const getPlatforms = () => {
    return (dispatch, getState) => {
      const { platforms } = getState();

      if (platforms.length) {
        return $q.when(platforms)
          .then(() => dispatch({ type: GET_PLATFORMS, payload: platforms }));
      } else {
        const platformPromise = dimPlatformService.getPlatforms()
          .then((platforms) => {
            dispatch({ type: GET_PLATFORMS, payload: platforms });
          })
          .then(() => dimPlatformService.getActive())
          .then((platform) => {
            dispatch({ type: GET_SELECTED_PLATFORM, payload: platform });
          });

        loadingTracker.addPromise(platformPromise);

        return platformPromise;
      }
    };
  };

  const selectPlatform = (platform = initialPlatform) => {
    return { type: GET_SELECTED_PLATFORM, payload: platform };
  };

  // const savePlatform = platform => {
  //   const hasId = !!platform.id;
  //   const type = hasId ? UPDATE_PLATFORM : CREATE_PLATFORM;

  //   if (!hasId) {
  //     platform.id = uniqueId(100); // simulating backend
  //   }

  //   return { type, payload: platform };
  // };

  // const deletePlatform = (platform) => {
  //   return { type: DELETE_PLATFORM, payload: platform };
  // };

  const resetSelectedPlatform = () => {
    return { type: RESET_SELECTED_PLATFORM };
  };

  return {
    getPlatforms,
    selectPlatform,
    // savePlatform,
    // deletePlatform,
    resetSelectedPlatform
  };
};

export const platforms = (state = [], { type, payload }) => {
  switch (type) {
    case GET_PLATFORMS:
      return payload || state;
      // case CREATE_BOOKMARK:
      //   return [...state, payload];
      // case UPDATE_BOOKMARK:
      //   return state.map(bookmark => bookmark.id === payload.id ? payload : bookmark);
      // case DELETE_BOOKMARK:
      //   return reject(state, bookmark => bookmark.id === payload.id);
    default:
      return state;
  }
};

const initialPlatform = null;

export const platform = (state = initialPlatform, { type, payload }) => {
  switch (type) {
    case GET_SELECTED_PLATFORM:
      return payload || state;
    case RESET_SELECTED_PLATFORM:
      return initialPlatform;
    default:
      return state;
  }
};