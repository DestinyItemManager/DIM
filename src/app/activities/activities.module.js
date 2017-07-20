import angular from 'angular';

import bungieApiModule from '../bungie-api/bungie-api.module';
import { ActivitiesComponent } from './activities.component';

export default angular
  .module('activitiesModule', [bungieApiModule])
  .component('activities', ActivitiesComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'destiny1.activities',
      component: 'activities',
      url: '/activities'
    });
  })
  .name;
