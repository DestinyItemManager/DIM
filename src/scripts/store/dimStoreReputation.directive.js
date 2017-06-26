import angular from 'angular';
import template from './dimStoreReputation.directive.html';

const StoreReputation = {
  controllerAs: 'vm',
  bindings: {
    store: '<storeData'
  },
  template: template
};

angular.module('dimApp')
  .component('dimStoreReputation', StoreReputation);
