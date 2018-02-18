import angular from 'angular';

import { Destiny1Component } from './destiny1.component';

import recordBooksModule from '../record-books/record-books.module';
import activitiesModule from '../activities/activities.module';
import loadoutBuilderModule from '../loadout-builder/loadout-builder.module';
import vendorsModule from '../vendors/vendors.module';
import { destinyAccountResolver } from '../shell/destiny-account.route';
import { ManifestService } from '../services/dimManifestService.factory';
import { BucketService } from './d1-buckets.service';
import { Definitions } from './d1-definitions.service';

export default angular
  .module('destiny1Module', [
    recordBooksModule,
    activitiesModule,
    loadoutBuilderModule,
    vendorsModule
  ])
  .factory('dimManifestService', ManifestService)
  .factory('dimBucketService', BucketService)
  .factory('dimDefinitions', Definitions)
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
