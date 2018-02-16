import angular from 'angular';

import { ActivitiesComponent } from './activities.component';

export default angular
  .module('activitiesModule', [])
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
