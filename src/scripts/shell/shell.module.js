import angular from 'angular';
import ngReduxModule from 'ng-redux';
import UIRouterModule from 'angular-ui-router';
import { DimAppModule } from '../dimApp.module';

import { ActivityTrackerDirective, ActivityTrackerService } from './activity-tracker';
import { PlatformChoiceComponent } from './platform-choice';
import { ShellComponent } from './shell';
import { PlatformsActions } from './platform/platform.state';

export const ShellModule = angular
  .module('dimShell', [
    DimAppModule,
    UIRouterModule,
    ngReduxModule
  ])
  .directive('dimActivityTracker', ActivityTrackerDirective)
  .service('dimActivityTrackerService', ActivityTrackerService)
  .factory('PlatformsActions', PlatformsActions)
  .component('dimPlatformChoice', PlatformChoiceComponent)
  .component('dimShell', ShellComponent)
  .config(function($stateProvider) {
    'ngInject';

    const states = [{
      name: 'shell',
      parent: 'root',
      abstract: true,
      component: 'dimShell'
    }];

    states.forEach((state) => {
      $stateProvider.state(state);
    });
  })
  .name;