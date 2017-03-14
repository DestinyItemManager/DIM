import angular from 'angular';
import ngReduxModule from 'ng-redux';
import uiRouterModule from 'angular-ui-router';
import dimAppModule from '../dimApp.module';

import routes from './shell.routes';

import activityTrackerDirective from './activity-tracker/activity-tracker.directive';
import activityTrackerService from './activity-tracker/activity-tracker.service';
import platformActions from './platform/platform.actions';
import platformChoiceComponent from './platform-choice/platform-choice.component';
import shellComponent from './shell/shell.component';

const shellModule = angular
  .module('dimShell', [
    dimAppModule,
    uiRouterModule,
    ngReduxModule
  ])
  .directive('dimActivityTracker', activityTrackerDirective)
  .service('dimActivityTrackerService', activityTrackerService)
  .factory('PlatformsActions', platformActions)
  .component('dimPlatformChoice', platformChoiceComponent)
  .component('dimShell', shellComponent)
  .config(routes)
  .name;

export default shellModule;
