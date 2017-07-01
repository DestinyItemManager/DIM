import angular from 'angular';

import UIRouterModule from '@uirouter/angularjs';

import { ActivityTrackerDirective, ActivityTrackerService } from './activity-tracker';
import { PlatformChoiceComponent } from './platform-choice/platform-choice.component';
import contentComponent from './content/content.component';
import backLinkComponent from './shell/backLink.component';
import { RefreshStoresComponent } from './refresh-stores.component';
import { CountdownComponent } from './countdown.component';
import { BungieAlertsComponent } from './bungie-alerts.component';
import { StarRatingComponent } from './star-rating/star-rating.component';

export const ShellModule = angular
  .module('dimShell', [
    UIRouterModule
  ])
  .directive('dimActivityTracker', ActivityTrackerDirective)
  .service('dimActivityTrackerService', ActivityTrackerService)
  .component('bungieAlerts', BungieAlertsComponent)
  .component('dimPlatformChoice', PlatformChoiceComponent)
  .component('refreshStores', RefreshStoresComponent)
  .component('content', contentComponent)
  .component('backLink', backLinkComponent)
  .component('countdown', CountdownComponent)
  .component('starRating', StarRatingComponent)
  .config(($stateProvider) => {
    'ngInject';

    // Content state is the base for "full" DIM views with a header
    $stateProvider.state({
      name: 'content',
      abstract: true,
      component: 'content'
    });
  })
  .name;
