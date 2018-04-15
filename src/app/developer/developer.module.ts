import { module } from 'angular';

import { DeveloperComponent } from './developer.component';
import { StateProvider } from '@uirouter/angularjs';

export default module('developerModule', [])
  .component('developer', DeveloperComponent)
  .config(($stateProvider: StateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'developer',
      url: '/developer',
      component: 'developer'
    });
  })
  .name;
