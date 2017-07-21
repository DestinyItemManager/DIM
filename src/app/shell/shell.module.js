import angular from 'angular';

import UIRouterModule from '@uirouter/angularjs';

import { ActivityTrackerDirective, ActivityTrackerService } from './activity-tracker';
import { RefreshComponent } from './refresh.component';
import { CountdownComponent } from './countdown.component';
import { BungieAlertsComponent } from './bungie-alerts.component';
import { StarRatingComponent } from './star-rating/star-rating.component';
import { ScrollClass } from './scroll-class.directive';
import { HeaderComponent } from './header.component';
import { defaultAccountRoute } from './default-account.route';
import { destinyAccountRoute } from './destiny-account.route';

export const ShellModule = angular
  .module('dimShell', [
    UIRouterModule
  ])
  .directive('dimActivityTracker', ActivityTrackerDirective)
  .service('dimActivityTrackerService', ActivityTrackerService)
  .component('bungieAlerts', BungieAlertsComponent)
  .component('refresh', RefreshComponent)
  .component('countdown', CountdownComponent)
  .component('starRating', StarRatingComponent)
  .component('header', HeaderComponent)
  .directive('scrollClass', ScrollClass)
  .config(defaultAccountRoute)
  .config(destinyAccountRoute)
  .name;
