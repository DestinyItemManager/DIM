import angular from 'angular';

import { StorageComponent } from './storage.component';

export default angular
  .module('storageModule', [])
  .component('storage', StorageComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'storage',
      parent: 'content',
      component: 'storage',
      url: '/storage'
    });
  })
  .name;
