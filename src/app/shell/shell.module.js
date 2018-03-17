import angular from 'angular';

import UIRouterModule from '@uirouter/angularjs';

import { ActivityTrackerDirective, ActivityTrackerService } from './activity-tracker';
import { CountdownComponent } from './countdown.component';
import { BungieAlertsComponent } from './bungie-alerts.component';
import { StarRatingComponent } from './star-rating/star-rating.component';
import { ScrollClass } from './scroll-class.directive';
import Header from './Header';
import { ManifestProgressComponent } from './manifest-progress.component';
import { defaultAccountRoute } from './default-account.route';
import { destinyAccountRoute } from './destiny-account.route';
import aboutTemplate from 'app/views/about.html';
import supportTemplate from 'app/views/support.html';
import PageController from './page.controller';
import { ClickAnywhereButHere } from './click-anywhere-but-here.directive';
import loadingTracker from './dimLoadingTracker.factory';
import dimAngularFiltersModule from './dimAngularFilters.filter';
import { react2angular } from 'react2angular';

export const ShellModule = angular
  .module('dimShell', [
    UIRouterModule,
    dimAngularFiltersModule
  ])
  .directive('dimActivityTracker', ActivityTrackerDirective)
  .service('dimActivityTrackerService', ActivityTrackerService)
  .factory('loadingTracker', loadingTracker)
  .component('bungieAlerts', BungieAlertsComponent)
  .component('countdown', CountdownComponent)
  .component('starRating', StarRatingComponent)
  .component('header', react2angular(Header, [], ['$scope']))
  .component('dimManifestProgress', ManifestProgressComponent)
  .directive('scrollClass', ScrollClass)
  .directive('dimClickAnywhereButHere', ClickAnywhereButHere)
  .config(defaultAccountRoute)
  .config(destinyAccountRoute)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'about',
      template: aboutTemplate,
      controller: PageController,
      url: '/about'
    });

    $stateProvider.state({
      name: 'support',
      template: supportTemplate,
      controller: PageController,
      url: '/backers'
    });
  })
  .name;
