import angular from 'angular';

import { Destiny2Component } from './destiny2.component';

export default angular
  .module('destiny2Module', [])
  .component('destiny2', Destiny2Component)
  .config(($stateProvider) => {
    'ngInject';

    // Root state for Destiny 2 views
    $stateProvider.state({
      name: 'destiny2',
      parent: 'destiny-account',
      url: '/d2',
      component: 'destiny2'
    });
  })
  .name;
