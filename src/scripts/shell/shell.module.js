import angular from 'angular';

import UIRouterModule from '@uirouter/angularjs';

import { ActivityTrackerDirective, ActivityTrackerService } from './activity-tracker';
import contentComponent from './content/content.component';
import backLinkComponent from './shell/backLink.component';
import { RefreshStoresComponent } from './refresh-stores.component';
import { CountdownComponent } from './countdown.component';
import { BungieAlertsComponent } from './bungie-alerts.component';
import { StarRatingComponent } from './star-rating/star-rating.component';
import { ScrollClass } from './scroll-class.directive';

export const ShellModule = angular
  .module('dimShell', [
    UIRouterModule
  ])
  .directive('dimActivityTracker', ActivityTrackerDirective)
  .service('dimActivityTrackerService', ActivityTrackerService)
  .component('bungieAlerts', BungieAlertsComponent)
  .component('refreshStores', RefreshStoresComponent)
  .component('content', contentComponent)
  .component('backLink', backLinkComponent)
  .component('countdown', CountdownComponent)
  .component('starRating', StarRatingComponent)
  .directive('scrollClass', ScrollClass)
  .config(($stateProvider) => {
    'ngInject';

    // Content state is the base for "full" DIM views with a header
    $stateProvider.state({
      name: 'content',
      abstract: true,
      component: 'content'
    });

    // TODO: move this, and/or replace "content" with this
    // TODO: use https://github.com/angular-ui/ui-router/wiki/Multiple-Named-Views to inject stuff into header
    $stateProvider.state({
      name: 'destiny1account',
      abstract: true,
      parent: 'content',
      url: '/d1/:destinyMembershipId-:platformType',
      resolve: {
        destinyMembershipId: ($stateParams) => $stateParams.destinyMembershipId,
        platformType: ($stateParams) => $stateParams.platformType,
      }
    });
  })
  .name;
