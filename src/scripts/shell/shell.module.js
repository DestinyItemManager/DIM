import angular from 'angular';

import UIRouterModule from 'angular-ui-router';

import { ActivityTrackerDirective, ActivityTrackerService } from './activity-tracker';
import { PlatformChoiceComponent } from './platform-choice';
import { ShellComponent } from './shell';

export const ShellModule = angular
  .module('dimShell', [
    UIRouterModule
  ])
  .directive('dimActivityTracker', ActivityTrackerDirective)
  .service('dimActivityTrackerService', ActivityTrackerService)
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