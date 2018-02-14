import { StateProvider } from '@uirouter/angularjs';
import { module } from 'angular';
import { react2angular } from 'react2angular';
import { Progress } from './progress';
import { ProgressService } from './progress.service';

// This is the Destiny 2 "Progress" page with milestones and factions.
export const progressModule = module('progressModule', [])
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
