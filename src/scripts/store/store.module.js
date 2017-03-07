import angular from 'angular';
import storeActions from './store.actions';

const storeModule = angular
  .module('store', [])
  .factory('StoreActions', storeActions)
  .name;

export default storeModule;