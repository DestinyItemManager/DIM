import angular from 'angular';

import { Destiny1Component } from './destiny1.component';

import recordBooksModule from '../record-books/record-books.module';
import activitiesModule from '../activities/activities.module';
import loadoutBuilderModule from '../loadout-builder/loadout-builder.module';
import vendorsModule from '../vendors/vendors.module';
import { destinyAccountResolver } from '../shell/destiny-account.route';

export default angular
  .module('destiny1Module', [
    recordBooksModule,
    activitiesModule,
    loadoutBuilderModule,
    vendorsModule
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
      component: 'destiny1',
      resolve: {
        account: destinyAccountResolver(1)
      }
    });
  });
