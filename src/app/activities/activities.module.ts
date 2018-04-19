import { module } from 'angular';

import { ActivitiesComponent } from './activities.component';
import { StateProvider } from '@uirouter/angularjs';

export default module('activitiesModule', [])
  .component('activities', ActivitiesComponent)
  .config(($stateProvider: StateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'destiny1.activities',
      component: 'activities',
      url: '/activities'
    });
  })
  .name;
