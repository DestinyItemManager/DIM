import angular from 'angular';
import 'angular-duration-format';

import bungieApiModule from '../bungie-api/bungie-api.module';
import { ActivitiesComponent } from './activities.component';

export default angular
  .module('activitiesModule', ['angular-duration-format', bungieApiModule])
  .component('activities', ActivitiesComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'activities',
      parent: 'destiny1account',
      component: 'activities',
      url: '/activities'
    });
  })
  .name;
