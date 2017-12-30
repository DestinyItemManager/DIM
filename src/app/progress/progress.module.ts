import { module } from 'angular';
import { IStateProvider } from 'angular-ui-router'
import { react2angular } from 'react2angular';

import bungieApiModule from '../bungie-api/bungie-api.module';
import { ProgressService } from './progress.service';
import { Progress } from './progress.component';

// This is the Destiny 2 "Progress" page with milestones and factions.
export default module('progressModule', [bungieApiModule])
  .factory('ProgressService', ProgressService)
  .component('progress', react2angular(Progress, ['account'], ['ProgressService', '$scope']))
  .config(($stateProvider: IStateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'destiny2.progress',
      component: 'progress',
      url: '/progress'
    });
  })
  .name;
