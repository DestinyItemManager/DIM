import template from './dimStoreReputation.directive.html';
import './dimStoreReputation.scss';
import { IComponentOptions } from 'angular';

export const StoreReputation: IComponentOptions = {
  controllerAs: 'vm',
  bindings: {
    store: '<storeData'
  },
  template
};
