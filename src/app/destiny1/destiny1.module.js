import angular from 'angular';

import { Destiny1Component } from './destiny1.component';

import recordBooksModule from '../record-books/record-books.module';
import activitiesModule from '../activities/activities.module';
import loadoutBuilderModule from '../loadout-builder/loadout-builder.module';
import vendorsrModule from '../vendors/vendors.module';

export default angular
  .module('destiny1Module', [
    recordBooksModule,
    activitiesModule,
    loadoutBuilderModule,
    vendorsrModule
  ])
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
  });
