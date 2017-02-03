export const GET_PLATFORMS = 'GET_PLATFORMS';
export const CREATE_PLATFORM = 'CREATE_PLATFORM';
export const UPDATE_PLATFORM = 'UPDATE_PLATFORM';
export const DELETE_PLATFORM = 'DELETE_PLATFORM';
export const GET_SELECTED_PLATFORM = 'GET_SELECTED_PLATFORM';
export const SET_SELECTED_PLATFORM = 'SET_SELECTED_PLATFORM';
export const RESET_SELECTED_PLATFORM = 'RESET_SELECTED_PLATFORM';

export const PlatformsActions = ($ngRedux, $q, dimPlatformService, loadingTracker) => {
  'ngInject';

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
            dispatch({ type: SET_SELECTED_PLATFORM, payload: platform });
          });

        loadingTracker.addPromise(platformPromise);

        return platformPromise;
      }
    };
  };

  const getPlatform = (platform = initialPlatform) => {
    return { type: GET_SELECTED_PLATFORM, payload: platform };
  };

  const setPlatform = (platform) => {
    return (dispatch) => {
      const platformPromise = dimPlatformService.setActive(platform)
        .then(() => {
          dispatch({ type: SET_SELECTED_PLATFORM, payload: platform });
        });

      loadingTracker.addPromise(platformPromise);

      return platformPromise;
    };
  };

  const resetSelectedPlatform = () => {
    return { type: RESET_SELECTED_PLATFORM };
  };

  return {
    getPlatforms,
    getPlatform,
    setPlatform,
    resetSelectedPlatform
  };
};

export const platforms = (state = [], { type, payload }) => {
  switch (type) {
    case GET_PLATFORMS:
      return payload || state;
    default:
      return state;
  }
};

const initialPlatform = null;

export const platform = (state = initialPlatform, { type, payload }) => {
  switch (type) {
    case GET_SELECTED_PLATFORM:
      return payload || state;
    case SET_SELECTED_PLATFORM:
      return payload;
    case RESET_SELECTED_PLATFORM:
      return initialPlatform;
    default:
      return state;
  }
};