import template from './dimStoreReputation.directive.html';
import './dimStoreReputation.scss';

export const StoreReputation = {
  controllerAs: 'vm',
  bindings: {
    store: '<storeData'
  },
  template
};