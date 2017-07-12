import angular from 'angular';

import { DeveloperComponent } from './developer.component';

export default angular
  .module('developerModule', [])
  .factory('developer', DeveloperComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'developer',
      url: '/developer',
      component: 'developer'
    });
  })
  .name;
