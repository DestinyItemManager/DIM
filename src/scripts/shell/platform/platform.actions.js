const LOAD = '[Platform] Load';
const ADD = '[Platform] Add';
const SET_SELECTED = '[Platform] Set Selected';

export const actionTypes = {
  LOAD,
  ADD,
  SET_SELECTED
};

export const platformActions = (dimPlatformService, loadingTracker) => {
  'ngInject';

  const loadPlatforms = () => {
    return (dispatch, getState) => {
      const { platform: state } = getState();

      if (!state.loaded) {
        const platformPromise = dimPlatformService.getPlatforms()
          .then((platforms) => {
            platforms.forEach((platform) => {
              dispatch(addPlatform(platform));
            });
          })
          .then(() => dimPlatformService.getActive())
          .then((platform) => {
            dispatch(setSelectedPlatform(platform));
            dispatch({ type: actionTypes.LOAD, payload: true });
          });

        loadingTracker.addPromise(platformPromise);

        return platformPromise;
      }

      return dispatch({ type: actionTypes.LOAD, payload: true });
    };
  };

  const addPlatform = (platform) => {
    return { type: actionTypes.ADD, payload: platform };
  };

  const setSelectedPlatform = (platform) => {
    return (dispatch) => {
      const platformPromise = dimPlatformService.setActive(platform)
        .then(() => {
          dispatch({ type: actionTypes.SET_SELECTED, payload: platform });
        });

      loadingTracker.addPromise(platformPromise);

      return platformPromise;
    };
  };

  return {
    loadPlatforms,
    addPlatform,
    setSelectedPlatform
  };
};

export default platformActions;