import angular from 'angular';

import { Destiny1Component } from './destiny1.component';

export default angular
  .module('destiny1Module', [])
  .component('destiny1', Destiny1Component)
  .config(($stateProvider) => {
    'ngInject';

    // Parent state for Destiny 1 views
    $stateProvider.state({
      name: 'destiny1',
      parent: 'destiny-account',
      redirectTo: 'destiny1.inventory',
      url: '/d1',
      component: 'destiny1'
    });
  })
  .name;
