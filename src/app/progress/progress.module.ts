import { module } from 'angular';
import { StateProvider } from '@uirouter/angularjs';
import { react2angular } from 'react2angular';

import bungieApiModule from '../bungie-api/bungie-api.module';
import { ProgressService } from './progress.service';
import { Progress } from './progress';

// This is the Destiny 2 "Progress" page with milestones and factions.
export const progressModule = module('progressModule', [bungieApiModule])
  .factory('ProgressService', ProgressService)
  .component('d2Progress', react2angular(Progress, ['account'], ['ProgressService', '$scope', 'dimSettingsService']))
  .config(($stateProvider: StateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'destiny2.progress',
      component: 'd2Progress',
      url: '/progress'
    });
  })
  .name;
