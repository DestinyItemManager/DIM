import angular from 'angular';
import template from './dimStoreReputation.directive.html';

var StoreReputation = {
  controllerAs: 'vm',
  bindings: {
    store: '<storeData'
  },
  template: template
};

angular.module('dimApp')
  .component('dimStoreReputation', StoreReputation);
