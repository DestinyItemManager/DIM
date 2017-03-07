const ADD = '[Store] Add';
const ADD_ALL = '[Store] Add All';
const REMOVE_ALL = '[Store] Remove All';

export const actionTypes = {
  ADD,
  ADD_ALL,
  REMOVE_ALL
};

export const storeActions = () => {
  'ngInject';

  const addStore = (store) => {
    return { type: actionTypes.ADD, payload: store };
  };

  const addStores = (stores) => {
    return { type: actionTypes.ADD_ALL, payload: stores };
  };

  const removeAllStores = () => {
    return { type: actionTypes.REMOVE_ALL };
  };

  return {
    addStore,
    addStores,
    removeAllStores
  };
};

export default storeActions;